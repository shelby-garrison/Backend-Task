import prisma from '../config/database';

interface ContactInput {
  email?: string;
  phoneNumber?: string;
}

interface ContactResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export class ContactService {
  async identifyContact(input: ContactInput): Promise<ContactResponse> {
    const { email, phoneNumber } = input;

    // Step 1: Find matching contacts using input
    const initialMatches = await prisma.contact.findMany({
      where: {
        OR: [
          email ? { email } : undefined,
          phoneNumber ? { phoneNumber } : undefined
        ].filter(Boolean) as any
      },
      orderBy: { createdAt: 'asc' }
    });

    // Step 2: If no existing contact, create a new primary contact
    if (initialMatches.length === 0) {
      const newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'primary'
        }
      });

      return {
        contact: {
          primaryContatctId: newContact.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: []
        }
      };
    }

    // Step 3: Traverse to collect only reachable connected component
    const visited = new Set<number>();
    const queue: number[] = [];

    for (const contact of initialMatches) {
      queue.push(contact.id);
      if (contact.linkedId) queue.push(contact.linkedId);
    }

    while (queue.length > 0) {
      const id = queue.shift();
      if (!id || visited.has(id)) continue;
      visited.add(id);

      const links = await prisma.contact.findMany({
        where: {
          OR: [{ id }, { linkedId: id }]
        }
      });

      for (const link of links) {
        if (!visited.has(link.id)) queue.push(link.id);
        if (link.linkedId && !visited.has(link.linkedId)) queue.push(link.linkedId);
      }
    }

    // Step 4: Fetch all visited contacts in connected component
    const allContacts = await prisma.contact.findMany({
      where: {
        id: { in: Array.from(visited) }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Step 5: Identify the true primary
    const primaryContact = allContacts.reduce((prev, curr) => {
      if (prev.linkPrecedence === 'primary' && curr.linkPrecedence !== 'primary') return prev;
      if (curr.linkPrecedence === 'primary' && prev.linkPrecedence !== 'primary') return curr;
      return prev.createdAt < curr.createdAt ? prev : curr;
    });

    // Step 6: Update all other primaries to be secondaries of the true primary
    const updatePromises = allContacts
      .filter(c => c.id !== primaryContact.id && c.linkPrecedence === 'primary')
      .map(c =>
        prisma.contact.update({
          where: { id: c.id },
          data: {
            linkPrecedence: 'secondary',
            linkedId: primaryContact.id
          }
        })
      );
    await Promise.all(updatePromises);

    // Step 7: Create a new secondary if input combination doesn't already exist
    const emailExists = email && allContacts.some(c => c.email === email);
    const phoneExists = phoneNumber && allContacts.some(c => c.phoneNumber === phoneNumber);
    const alreadyExists = (email ? emailExists : true) && (phoneNumber ? phoneExists : true);

    if (!alreadyExists && (email || phoneNumber)) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'secondary',
          linkedId: primaryContact.id
        }
      });

      // Recurse once to include new contact in final response
      return await this.identifyContact({ email, phoneNumber });
    }

    // Step 8: Fetch only the immediate group (primary + secondaries linked to it)
    const finalContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContact.id },
          { linkedId: primaryContact.id }
        ]
      }
    });

    // Step 9: Format the final response
    const emails = Array.from(new Set(finalContacts.map(c => c.email).filter((email): email is string => email !== null && email !== undefined)));
    const phoneNumbers = Array.from(new Set(finalContacts.map(c => c.phoneNumber).filter((phone): phone is string => phone !== null && phone !== undefined)));
    const secondaryContactIds = finalContacts
      .filter(c => c.id !== primaryContact.id)
      .map(c => c.id);

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    };
  }
}
