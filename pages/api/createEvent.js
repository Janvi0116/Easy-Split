import getAppManagerInstance from '../../lib/AppManager';

const appManager = getAppManagerInstance();

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { name, persons } = req.body;
    let response = appManager.createNewEvent(name, persons);
    res.status(200).json({ message: 'Event created successfully',eventId:response.id });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
