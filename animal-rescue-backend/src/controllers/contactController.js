const EMERGENCY_CONTACTS = require('../data/emergencyContacts');

// GET /api/v1/contacts
exports.getEmergencyContacts = (req, res) => {
  const { category, search } = req.query;
  let contacts = [...EMERGENCY_CONTACTS];

  if (category) {
    contacts = contacts.filter((c) =>
      c.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  if (search) {
    const q = search.toLowerCase();
    contacts = contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    city: 'Bengaluru',
    count: contacts.length,
    contacts,
  });
};
