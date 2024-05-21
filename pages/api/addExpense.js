import getAppManagerInstance from '../../lib/AppManager';

const appManager = getAppManagerInstance();

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { eventId, expenseDetails } = req.body;
    appManager.addExepense(eventId, expenseDetails);
    res.status(200).json({ message: 'Expense added successfully' });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
