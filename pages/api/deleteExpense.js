import getAppManagerInstance from '../../lib/AppManager';

const appManager = getAppManagerInstance();

export default function handler(req, res) {
  if (req.method === 'DELETE') {
    const { eventId, expenseId } = req.body;
    appManager.deleteExpense(eventId, expenseId);
    res.status(200).json({ message: 'Expense deleted successfully' });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
} 