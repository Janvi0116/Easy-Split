import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
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
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Drawer,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Divider,
  FormHelperText,
  Fab,
  Menu
} from '@mui/material';
import { Add, Close, Edit, Delete, MoreVert } from '@mui/icons-material';

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

// Separate component for expense form that works both as modal and drawer
const ExpenseForm = ({ open, onClose, eventDetails, onSubmit, initialData,isMobile }) => {
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    date: '',
    paidBy: '',
    splitMethod: 'equal',
    personsInvolved: eventDetails?.persons?.map(p => p.id) || [],
    personToAmountMap: {}
  });
  const [errors, setErrors] = useState({});
  const [splitWithAll, setSplitWithAll] = useState(true);
  const [selectedDistributionMethod, setSelectedDistributionMethod] = useState('equal');

  useEffect(() => {
    if (initialData) {
      setExpenseForm({
        ...initialData,
        splitMethod  : initialData.distributionStrategy.name,
        paidBy : initialData.paidById,
        date: initialData.date.split('T')[0]
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!expenseForm.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!expenseForm.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(expenseForm.amount) || Number(expenseForm.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!expenseForm.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!expenseForm.paidBy) {
      newErrors.paidBy = 'Please select who paid';
    }

    if (expenseForm.splitMethod === 'unequal' && 
        (!expenseForm.personToAmountMap || 
         Object.keys(expenseForm.personToAmountMap).length === 0)) {
      newErrors.splitMethod = 'Please specify amounts for unequal split';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(expenseForm);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'splitWithAll') {
      setSplitWithAll(checked);
      if (checked) {
        setExpenseForm(prev => ({
          ...prev,
          personsInvolved: eventDetails.persons.map(p => p.id)
        }));
      }
    } else {
      setExpenseForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const formContent = (
    <Stack spacing={3} sx={{ p: 3 }}>
      <Typography variant="h6">Add Expense</Typography>
      
      <TextField
        label="Description"
        name="description"
        value={expenseForm.description}
        onChange={handleChange}
        error={!!errors.description}
        helperText={errors.description}
        fullWidth
        required
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Amount"
          name="amount"
          type="number"
          value={expenseForm.amount}
          onChange={handleChange}
          error={!!errors.amount}
          helperText={errors.amount}
          fullWidth
          required
        />
        <TextField
          label="Date"
          name="date"
          type="date"
          value={expenseForm.date}
          onChange={handleChange}
          error={!!errors.date}
          helperText={errors.date}
          InputLabelProps={{ shrink: true }}
          fullWidth
          required
        />
      </Stack>

      <FormControl fullWidth error={!!errors.paidBy} required>
        <InputLabel>Paid By</InputLabel>
        <Select
          name="paidBy"
          value={expenseForm.paidBy}
          onChange={handleChange}
          label="Paid By"
        >
          {eventDetails?.persons?.map(person => (
            <MenuItem key={person.id} value={person.id}>
              {person.name}
            </MenuItem>
          ))}
        </Select>
        {errors.paidBy && (
          <FormHelperText>{errors.paidBy}</FormHelperText>
        )}
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Split Method</InputLabel>
        <Select
          name="splitMethod"
          value={expenseForm.splitMethod}
          onChange={handleChange}
          label="Split Method"
        >
          <MenuItem value="equal">Equal</MenuItem>
          <MenuItem value="unequal">Unequal</MenuItem>
        </Select>
      </FormControl>

      {expenseForm.splitMethod === 'equal' && (
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

      {expenseForm.splitMethod === 'unequal' && (
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

      <Button 
        variant="contained" 
        onClick={handleSubmit}
        fullWidth
      >
        Add Expense
      </Button>
    </Stack>
  );

  return isMobile ? (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '90vh'
        }
      }}
    >
      {formContent}
    </Drawer>
  ) : (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { sm: '500px' },
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {formContent}
      </Box>
    </Modal>
  );
};

const EventPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [eventDetails, setEventDetails] = useState(null);
  const [invalidEvent, setInvalidEvent] = useState(false);
  const router = useRouter();
  const [eventId, setEventId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', date: '', paidBy: '', splitMethod: 'equal',personsInvolved:[],personToAmountMap :{}});
  
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
  };
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [settledPayments, setSettledPayments] = useState([]);
  
  useEffect(() => {
    const { id } = router.query;
    if (id) {
      setEventId(id);
      fetchEventDetails(id);
    }
  }, [router.query]);

  const fetchEventDetails = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/getEventData?eventId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setEventDetails(data);
        setError(null);
      } else if (response.status === 404) {
        setError('Event not found');
        setEventDetails(null);
      } else {
        setError('Failed to fetch event details');
        setEventDetails(null);
      }
    } catch (error) {
      setError('Failed to fetch event details');
      setEventDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
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

  const handleAddExpense = async (expenseForm) => {
    try {
      const response = await fetch('/api/addExpense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          expenseDetails: expenseForm
        }),
      });
      
      if (response.ok) {
        // Reload event details after adding expense
        await fetchEventDetails(eventId, (data) => {
          setEventDetails(data);
        }, (error) => {
          setInvalidEvent(true);
        });
        setOpenModal(false); // Close modal after successful addition
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleExpenseMenuOpen = (event, expense) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleExpenseMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleEditButton = () => {
    setOpenModal(true);
  }

  const handleEditExpense = async (expenseForm) => {
    try {
      const response = await fetch('/api/editExpense', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          expenseId: selectedExpense.id,
          expenseDetails: expenseForm
        }),
      });
      
      if (response.ok) {
        await fetchEventDetails(eventId);
        setOpenModal(false);
      }
    } catch (error) {
      console.error('Failed to edit expense:', error);
    }
  };

  const handleDeleteExpense = async () => {
    try {
      const response = await fetch('/api/deleteExpense', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          expenseId: selectedExpense.id
        }),
      });
      
      if (response.ok) {
        await fetchEventDetails(eventId);
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
    handleExpenseMenuClose();
  };

  const handleSettlePayment = async (fromPerson, toPerson, amount) => {
    try {
      const response = await fetch('/api/settlePayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          fromPerson,
          toPerson,
          amount,
          date: new Date().toISOString()
        }),
      });
      
      if (response.ok) {
        await fetchEventDetails(eventId);
      }
    } catch (error) {
      console.error('Failed to settle payment:', error);
    }
  };

  // Enhanced UI with loading and error states
  if (loading) {
    return (
      <Container sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/')}
            sx={{ mt: 2 }}
          >
            Return to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Balance Sheet Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)'
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              borderBottom: '2px solid #2196f3',
              pb: 1,
              mb: 3
            }}
          >
            Balance Sheet
          </Typography>
          <Grid container spacing={2}>
            {eventDetails?.balanceSheet?.personToBalanceMap?.map((person) => (
              <Grid item xs={12} sm={6} md={4} key={person.id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    background: person.balance >= 0 
                      ? 'linear-gradient(45deg, #e8f5e9, #c8e6c9)'
                      : 'linear-gradient(45deg, #ffebee, #ffcdd2)',
                    borderRadius: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {person.name}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: person.balance >= 0 ? 'success.dark' : 'error.dark'
                      }}
                    >
                      ₹{Math.abs(person.balance)}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Payment History Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            background: 'linear-gradient(to right bottom, #f3f4f6, #e5e7eb)'
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              borderBottom: '2px solid #2196f3',
              pb: 1,
              mb: 3
            }}
          >
            Payment History
          </Typography>
          <Stack spacing={2}>
            {eventDetails?.balanceSheet?.personToTransfersMap?.map((person) => (
              person.transfers?.map((transfer, idx) => (
                <Paper 
                  key={`${person.id}-${idx}`}
                  elevation={2}
                  sx={{ 
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#ffffff'
                  }}
                >
                  <Stack 
                    direction="row" 
                    justifyContent="space-between" 
                    alignItems="center"
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1">
                        {person.name} owes {transfer.name}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ color: 'error.main' }}
                      >
                        ₹{transfer.amount}
                      </Typography>
                    </Stack>
                    {/* <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleSettlePayment(
                        person.id,
                        transfer.toPersonId,
                        transfer.amount
                      )}
                    >
                      Mark as Settled
                    </Button> */}
                  </Stack>
                </Paper>
              ))
            ))}
          </Stack>
        </Paper>

        {/* Expenses Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            background: 'linear-gradient(to right bottom, #f8fafc, #f1f5f9)'
          }}
        >
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center" 
            sx={{ 
              borderBottom: '2px solid #2196f3',
              pb: 1,
              mb: 3
            }}
          >
            <Typography variant="h4">Expenses</Typography>
          </Stack>
          
          {eventDetails?.expenses?.length > 0 ? (
            <Stack spacing={2}>
              {eventDetails.expenses.map((expense, index) => (
                <Paper 
                  key={index} 
                  elevation={2} 
                  sx={{ 
                    p: 2.5,
                    borderRadius: 2,
                    transition: 'transform 0.2s',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#ffffff',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack 
                      direction="row" 
                      justifyContent="space-between" 
                      alignItems="center"
                    >
                      <Typography variant="h6" sx={{ color: 'primary.main' }}>
                        {expense.description}
                      </Typography>
                      <IconButton onClick={(e) => handleExpenseMenuOpen(e, expense)}>
                        <MoreVert />
                      </IconButton>
                    </Stack>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={2} 
                      sx={{ mt: 1 }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Amount: <span style={{ color: '#2196f3' }}>₹{expense.amount}</span>
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2">
                          Paid by: <strong>{expense.paidBy}</strong>
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {new Date(expense.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography 
              variant="body1" 
              color="text.secondary" 
              textAlign="center"
              sx={{ 
                py: 4,
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                border: '1px dashed #bdbdbd'
              }}
            >
              No expenses yet
            </Typography>
          )}
        </Paper>
      </Stack>

      {/* <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleExpenseMenuClose}
      >
        <MenuItem onClick={handleEditButton}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteExpense}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu> */}

      <ExpenseForm
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedExpense(null);
        }}
        eventDetails={eventDetails}
        onSubmit={selectedExpense ? handleEditExpense : handleAddExpense}
        initialData={selectedExpense}
        isMobile={isMobile}
      />

      <Fab 
        color="primary"
        aria-label="add expense"
        onClick={() => setOpenModal(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #2196f3, #1976d2)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976d2, #1565c0)'
          }
        }}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default EventPage;


