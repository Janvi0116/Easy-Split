import getAppManagerInstance from '../../lib/AppManager';

const appManager = getAppManagerInstance();

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { eventId } = req.query;
    let eventDetails;
    try{
      eventDetails = appManager.getEventDetails(eventId);
    }
    catch(err){
      console.error(err);
      if(err.stack.includes('Invalid event'))
        res.status(404).json({ message: 'Invalid Event Id' });
    }
    res.status(200).json(eventDetails);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
