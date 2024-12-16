import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  IconButton,
  Modal,
  Box,
  Paper
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useRouter } from 'next/router';

const WelcomeModal = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: '500px' },
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
      }}>
        <Typography variant="h5" gutterBottom>Welcome to EazySplit! 👋</Typography>
        <Typography variant="body1" paragraph>
          EazySplit makes it easy to split expenses with friends and family. Here's how to get started:
        </Typography>
        <Typography component="div" sx={{ mb: 2 }}>
          1️⃣ Create an event (e.g., "Beach Trip 2024")<br/>
          2️⃣ Add all participants<br/>
          3️⃣ Start adding expenses as they occur<br/>
          4️⃣ Let EazySplit calculate who owes whom
        </Typography>
        <Button variant="contained" onClick={onClose} fullWidth>
          Get Started
        </Button>
      </Box>
    </Modal>
  );
};

const EventCreationPage = () => {
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [persons, setPersons] = useState([{ name: '' }]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcomeModal = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcomeModal(false);
  };

  const handleAddPerson = () => {
    setPersons([...persons, { name: '' }]);
  };

  const handleRemovePerson = (index) => {
    if (persons.length > 1) {
      const updatedPersons = [...persons];
      updatedPersons.splice(index, 1);
      setPersons(updatedPersons);
    }
  };

  const handlePersonChange = (index, value) => {
    const updatedPersons = [...persons];
    updatedPersons[index].name = value;
    setPersons(updatedPersons);
  };

  const validateInputs = () => {
    const validationErrors = {};
    let errorFound = false;

    if (!eventName || eventName.length < 2 || eventName.length > 30) {
      errorFound = true;
      validationErrors.eventName = true;
    }

    persons.forEach((person, index) => {
      if (!person.name || person.name.length < 2 || person.name.length > 30) {
        errorFound = true;
        validationErrors[index] = true;
      }
    });

    setErrors(validationErrors);
    return !errorFound;
  };

  const handleSubmit = async () => {
    if (validateInputs()) {
      const transformedPersons = persons.map(person => {
        const [firstName, ...lastNameParts] = person.name.trim().split(' ');
        return {
          firstName,
          lastName: lastNameParts.join(' ') || ''
        };
      });

      try {
        const response = await fetch('/api/createEvent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: eventName, persons: transformedPersons }),
        });
        if (response.ok) {
          const data = await response.json();
          router.push(`/EventPage?id=${data.eventId}`);
        }
      } catch (error) {
        console.error('Failed to create event:', error);
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      py: 4,
      px: { xs: 2, sm: 3 }
    }}>
      <Typography 
        variant="h2" 
        component="h1" 
        align="center" 
        sx={{ 
          mb: 4,
          fontWeight: 'bold',
          color: 'primary.main',
          fontSize: { xs: '2.5rem', sm: '3.5rem' }
        }}
      >
        EazySplit
      </Typography>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Create Event
        </Typography>
        
        <TextField
          label="Event Name"
          variant="outlined"
          fullWidth
          size="medium"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          error={errors.eventName}
          helperText={errors.eventName ? 'Required (2-30 characters)' : ''}
          sx={{ mb: 3 }}
        />

        {persons.map((person, index) => (
          <Box 
            key={index} 
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}
          >
            <TextField
              label={`Person ${index + 1}`}
              variant="outlined"
              fullWidth
              size="medium"
              value={person.name}
              onChange={(e) => handlePersonChange(index, e.target.value)}
              error={errors[index]}
              helperText={errors[index] ? 'Required (2-30 characters)' : ''}
            />
            {persons.length > 1 && (
              <IconButton 
                onClick={() => handleRemovePerson(index)}
                color="error"
                sx={{ ml: 1 }}
              >
                <Close />
              </IconButton>
            )}
          </Box>
        ))}

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2,
          mt: 3
        }}>
          <Button 
            variant="outlined" 
            onClick={handleAddPerson}
            fullWidth
            size="large"
          >
            Add Person
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            fullWidth
            size="large"
          >
            Create Event
          </Button>
        </Box>
      </Paper>

      <WelcomeModal 
        open={showWelcomeModal} 
        onClose={handleCloseWelcomeModal}
      />
    </Container>
  );
};

export default EventCreationPage;
