import getAppManagerInstance from '../../lib/AppManager';

const appManager = getAppManagerInstance();

export default function handler(req, res) {
  if (req.method === 'PUT') {
    const { eventId, expenseId, expenseDetails } = req.body;
    try {
      appManager.editExpense(eventId, expenseId, expenseDetails);
      res.status(200).json({ message: 'Expense updated successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
} 