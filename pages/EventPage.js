import React, { useState, useEffect, useMemo } from 'react';
import { useRouter,withRouter } from 'next/router';
import { FormControlLabel,Checkbox,Container, Typography, Card, CardContent, Button, Grid, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress,Modal } from '@mui/material';

const fetchEventDetails = async (eventId,onSuccess,onFailure) => {
  try {
    const response = await fetch(`/api/getEventData?eventId=${eventId}`);
    if (response.ok) {
      const data = await response.json();
      if(onSuccess)
        onSuccess(data)
    } 
    else if (response.status === 404 && onFailure) {
      onFailure();
    } else {
      console.error('Failed to fetch event details:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to fetch event details:', error);
  } finally {
    
  }
};


const EventPage = () => {
  const [eventDetails, setEventDetails] = useState(null);
  const [invalidEvent, setInvalidEvent] = useState(false);
  const router = useRouter();
  const [eventId, setEventId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', date: '', paidBy: '', splitMethod: 'equal',personsInvolved:[],personToAmountMap : {}});
  const [loading, setLoading] = useState(true);
  const [openModal,setModalUi] = useState(false);
  const [splitWithAll, setSplitWithAll] = useState(true);
  const [selectedDistributionMethod, setSelectedDistributionMethod] = useState('equal');
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
  };
  
  useEffect(() => {
    // Extract event ID from query parameters
    const { id } = router.query;
    if (id) {
      setEventId(id);
      
      fetchEventDetails(id,(data) => {
        setEventDetails(data);
        setExpenseForm((prevState) => {
          return {...prevState,
            personsInvolved:data.persons.map((person) => person.id),
            personToAmountMap : data.persons.reduce((acc, person) => {return {...acc,[person.id] : 0}},{})
          }
        });
        setLoading(false);
      },(error) => {
        setLoading(false);
        setInvalidEvent(true);
      });
    }
  }, [router.query]);

  const handleOpenModal = () => {
    setModalUi(true);
  };
  
  const handleCloseModal = () => {
    setModalUi(false);
  };

  const handleChange = (e) => {
    if (e.target.name === 'splitWithAll') {
      setSplitWithAll(e.target.checked);
      if (e.target.checked) {
        setExpenseForm({
          ...expenseForm,
          personsInvolved: eventDetails.persons.map((person) => person.id),
        });
      }
    } else if (e.target.name === 'splitMethod') {
      setSelectedDistributionMethod(e.target.value);
      setExpenseForm({ ...expenseForm, splitMethod: e.target.value });
    } else {
      setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
    }
  };

  const handleAddExpense = async () => {
    try {
      const response = await fetch('/api/addExpense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({expenseDetails:expenseForm,eventId}),
      });
      if (response.ok) {
        // Reload event details after adding expense
        await fetchEventDetails(eventId,(data) => {
          setEventDetails(data);
        },(error) => {
          setInvalidEvent(true);
        });
        setModalUi(false);
      } else {
        console.error('Failed to add expense:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  return (
    <Container maxWidth="md" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
  {loading ? (
    <CircularProgress />
  ) : (
    invalidEvent ? (
      <div style={{ textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>Oops Wrong Event</Typography>
        <Button variant="contained" color="primary" href="/EventCreationPage">Create Event</Button>
      </div>
    ) : (
      <Grid container spacing={2} justifyContent="center">
        {/* Display Balance Sheet */}
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>Balance Sheet</Typography>
          {eventDetails && eventDetails.balanceSheet && eventDetails.balanceSheet.personToBalanceMap ? (
            eventDetails.balanceSheet.personToBalanceMap.map((personEntry) => (
              <Card variant="outlined" key={personEntry.id} style={{ backgroundColor: personEntry.balance >= 0 ? '#dcedc8' : '#ffcdd2', marginBottom: '10px' }}>
                <CardContent>
                  <Typography variant="body1">{personEntry.name}: {personEntry.balance}</Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body1">No balance sheet available</Typography>
          )}
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>Payment Resolution</Typography>
          {eventDetails && eventDetails.balanceSheet && eventDetails.balanceSheet.personToTransfersMap ? (
            <div>
              {eventDetails.balanceSheet.personToTransfersMap.map((personEntry) => (
                <Card variant="outlined" key={personEntry.id} style={{ marginBottom: '10px' }}>
                  <CardContent>
                    <Typography variant="body1">{personEntry.name}</Typography>
                    {personEntry.transfers && personEntry.transfers.length > 0 ? (
                      personEntry.transfers.map((owedTo, index) => (
                        <div key={index}>
                          <Typography variant="body2">Owes {owedTo.name}: {owedTo.amount}</Typography>
                        </div>
                      ))
                    ) : (
                      <Typography variant="body2">Does not owe anyone</Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Typography variant="body1">No payment resolution available</Typography>
          )}
        </Grid>


        {/* Display Event Expenses */}
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>Expenses</Typography>
          {eventDetails && eventDetails.expenses.length > 0 ? (
            eventDetails.expenses.map((expense, index) => (
              <Card variant="outlined" key={index} style={{ marginBottom: '10px' }}>
                <CardContent>
                  <Typography variant="body1">{expense.description}</Typography>
                  <Typography variant="body2">Amount: {expense.amount}</Typography>
                  <Typography variant="body2">Date: {expense.date}</Typography>
                  <Typography variant="body2">Paid By: {expense.paidBy}</Typography>
                  <Typography variant="body2">Split Method: {expense.distributionStrategy && expense.distributionStrategy.name}</Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body1">No expenses yet</Typography>
          )}
        </Grid>

        {/* Add Expense Button */}
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleOpenModal} style={{ marginTop: '20px' }}>Add Expense</Button>
        </Grid>

        {/* Expense Modal */}
        <Modal open={openModal} onClose={handleCloseModal}>
          <div style={modalStyle}>
            <Typography variant="h6" gutterBottom>Add Expense</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  name="description"
                  value={expenseForm.description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Amount"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  type="number"
                  name="amount"
                  value={expenseForm.amount}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Date"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  type="date"
                  name="date"
                  value={expenseForm.date}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl variant="outlined" fullWidth margin="normal">
                  <InputLabel>Paid By</InputLabel>
                  <Select
                    label="Paid By"
                    value={expenseForm.paidBy}
                    onChange={handleChange}
                    name="paidBy"
                  >
                    {eventDetails && eventDetails.persons.map(person => (
                      <MenuItem key={person.id} value={person.id}>{person.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl variant="outlined" fullWidth margin="normal">
                  <InputLabel>Split Method</InputLabel>
                  <Select
                    label="Split Method"
                    value={selectedDistributionMethod}
                    onChange={handleChange}
                    name="splitMethod"
                  >
                    <MenuItem value="equal">Equal</MenuItem>
                    <MenuItem value="unequal">Unequal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {selectedDistributionMethod === 'equal' && (
        <>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={splitWithAll}
                  onChange={handleChange}
                  name="splitWithAll"
                />
              }
              label="Distribute between all"
            />
          </Grid>
          {!splitWithAll && (
            <Grid item xs={12}>
              <Typography variant="subtitle1">Select persons involved:</Typography>
              {eventDetails.persons.map((person) => (
                <FormControlLabel
                  key={person.id}
                  control={
                    <Checkbox
                      checked={expenseForm.personsInvolved.includes(person.id)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setExpenseForm({
                          ...expenseForm,
                          personsInvolved: isChecked
                            ? [...expenseForm.personsInvolved, person.id]
                            : expenseForm.personsInvolved.filter(
                                (id) => id !== person.id
                              ),
                        });
                      }}
                    />
                  }
                  label={`${person.name}`}
                  style={{ display: 'block' }}
                />
              ))}
            </Grid>
          )}
        </>
      )}
      {selectedDistributionMethod === 'unequal' && (
        <Grid item xs={12}>
          <Typography variant="subtitle1">
            Enter amount for each person involved:
          </Typography>
          {eventDetails.persons.map((person) => (
            <Grid
              container
              key={person.id}
              spacing={2}
              alignItems="center"
              style={{ marginBottom: '10px' }}
            >
              <Grid item>
                <Typography variant="body1">
                  {person.name}:
                </Typography>
              </Grid>
              <Grid item>
                <TextField
                  type="number"
                  value={expenseForm.personToAmountMap?.[person.id] || ''}
                  onChange={(e) => {
                    setExpenseForm({
                      ...expenseForm,
                      personToAmountMap: {
                        ...expenseForm.personToAmountMap,
                        [person.id]: e.target.value ? parseFloat(e.target.value) : '',
                      },
                    });
                  }}
                />
              </Grid>
            </Grid>
          ))}
        </Grid>
      )}
            </Grid>
            <Button variant="contained" color="primary" onClick={handleAddExpense} style={{ marginTop: '20px' }}>Add Expense</Button>
          </div>
        </Modal>
      </Grid>
    )
  )}
</Container>

  );

};

export default withRouter(EventPage);


