import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { TextField, Button, Container, Typography, Grid, Card, CardContent, IconButton, FormHelperText } from '@mui/material';
import { Close } from '@mui/icons-material';

const EventCreationPage = () => {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [persons, setPersons] = useState([{ firstName: '', lastName: '' }]);
  const [errors, setErrors] = useState({});

  const handleAddPerson = () => {
    setPersons([...persons, { firstName: '', lastName: '' }]);
  };

  const handleRemovePerson = (index) => {
    const updatedPersons = [...persons];
    updatedPersons.splice(index, 1);
    setPersons(updatedPersons);
  };

  const handlePersonChange = (index, key, value) => {
    const updatedPersons = [...persons];
    updatedPersons[index][key] = value;
    setPersons(updatedPersons);
  };

  const validateInputs = () => {
    const validationErrors = {};
    let errorFound = false;
  // Check if event name is empty or exceeds length limits
    if (!eventName || eventName.length < 2 || eventName.length > 20) {
      errorFound = true;
      validationErrors.eventName = true;
    }
    for (const [index, person] of persons.entries()) {
      validationErrors[index] = {};
      if (!person.firstName || person.firstName.length < 2 || person.firstName.length > 20) {
        errorFound = true;
        validationErrors[index]['firstName'] = true;
      }
      if (!person.lastName || person.lastName.length < 2 || person.lastName.length > 20) {
        errorFound = true;
        validationErrors[index]['lastName'] = true;
      }
    }
    return { validationErrors,errorFound };
  };

  const handleSubmit = async () => {
    const { validationErrors,errorFound } = validateInputs();
    if (!errorFound) {
      try {
        const response = await fetch('/api/createEvent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: eventName, persons }),
        });
        if (response.ok) {
          let data = await response.json();
          router.push(`/EventPage?id=${data.eventId}`);
        } else {
          // Handle error
          console.error('Failed to create event:', response.statusText);
        }
      } catch (error) {
        // Handle error
        console.error('Failed to create event:', error);
      }
    } else {
      setErrors(validationErrors);
    }
  };

  return (
    <Container maxWidth="sm" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card variant="outlined" style={{ padding: '20px', width: '100%' }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>Create Event</Typography>
          <TextField
            label="Event Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            error={errors['eventName']}
            helperText={errors['eventName'] ? 'Required (2-20 characters)' : ''}
          />
          {persons.map((person, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1" gutterBottom style={{ marginRight: '10px' }}>Person {index + 1}</Typography>
                  <Grid container spacing={2} style={{ flex: 1 }}>
                    <Grid item xs={6}>
                    <TextField
                        label="First Name"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={person.firstName}
                        onChange={(e) => handlePersonChange(index, 'firstName', e.target.value)}
                        error={errors[index] && errors[index]['firstName']}
                      />
                      <FormHelperText error>
                        {errors[index] && errors[index]['firstName'] ? 'Required (2-20 characters)' : ''}
                      </FormHelperText>
                    </Grid>
                    <Grid item xs={6}>
                    <TextField
                        label="Last Name"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={person.lastName}
                        onChange={(e) => handlePersonChange(index, 'lastName', e.target.value)}
                        error={errors[index] && errors[index]['lastName']}
                      />
                      <FormHelperText error>
                        {errors[index] && errors[index]['lastName'] ? 'Required (2-20 characters)' : ''}
                      </FormHelperText>
                    </Grid>
                  </Grid>
                </div>
                <IconButton onClick={() => handleRemovePerson(index)}>
                  <Close />
                </IconButton>
            </div>  
          ))}
          <Button variant="contained" color="primary" onClick={handleAddPerson} style={{ marginTop: '10px' }}>
            Add Person
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            style={{ marginTop: '10px', marginLeft: '10px' }}
          >
            Create Event
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default EventCreationPage;
