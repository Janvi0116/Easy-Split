class AppManager{
    events
    constructor(){
        this.events = [];
    }
    createNewEvent(name,personsInfo){
        let newEvent = new Event(name,personsInfo);
        this.events.push(newEvent);
        return newEvent;
    }
    checkIfEventValid(eventId){
        let targetEvent = this.events.find(e => e.id === eventId)
        if(!targetEvent)
            throw new Error("Invalid event");
        return targetEvent;
    }
    addExepense(eventId,expenseDetails){
        let targetEvent = this.checkIfEventValid(eventId);
        targetEvent.recordExpense(expenseDetails);
    }
    getEventDetails(eventId){
        let targetEvent = this.checkIfEventValid(eventId);
        return {
            expenses : targetEvent.getExpenses(),
            persons : targetEvent.getPersons(),
            balanceSheet : targetEvent.getBalanceSheet()
        }
    }
    editExpense(eventId, expenseId, expenseDetails) {
        this.deleteExpense(eventId,expenseId);
        this.addExepense(eventId,expenseDetails);
    }

    deleteExpense(eventId, expenseId) {
        let targetEvent = this.checkIfEventValid(eventId);

        // Remove the expense
        targetEvent.expenses = targetEvent.expenses.filter(exp => exp.id !== expenseId);

        // Recalculate balances
        targetEvent.balanceSheet.refreshBalanceSheet(targetEvent.expenses);
    }
}

class Event{
    id;
    name;
    persons;
    expenses;
    balanceSheet;
    constructor(name,persons){
        this.id = generateId();
        this.name = name;
        this.persons = persons.map((person) => new Person(person));
        this.expenses = [];
        this.balanceSheet = new BalanceSheet(this.persons);
    }
    recordExpense(expenseDetails){
        let newExpense = new Expense(expenseDetails);
        let idToSplitMap = newExpense.distributionStrategy.divide(newExpense.amount,expenseDetails);
        this.balanceSheet.updateBalanceSheet(idToSplitMap,newExpense.paidBy);
        this.expenses.push(newExpense);

    }
    getExpenses(){
        return this.expenses.map((expense) => {
            let targetP = this.persons.find((person) => person.id === expense.paidBy);
            let newExpense = {
                ...expense,
                paidBy : targetP.getFullName(),
                paidById : targetP.id,
                personsInvolved : expense.personsInvolved.map((personId) => {
                    let targetPb = this.persons.find((person) => person.id === personId);
                    return {
                        id : personId,
                        name : targetPb.getFullName()
                    }
                })
            }
            return newExpense;
        });
    }
    getBalanceSheet(){
        let obj = {
            personToBalanceMap : [],
            personToTransfersMap : []
        };
        Object.keys(this.balanceSheet.personToBalanceMap).forEach((personId) => {
            let targetPerson = this.persons.find((person) => person.id === personId);
            obj.personToBalanceMap.push({id:personId,name : targetPerson.getFullName(),balance : this.balanceSheet.personToBalanceMap[personId]});
        })
        Object.keys(this.balanceSheet.personToTransfersMap).forEach((personId) => {
            let targetPerson = this.persons.find((person) => person.id === personId);
            obj.personToTransfersMap.push({
                id:personId,
                name : targetPerson.getFullName(),
                transfers : this.balanceSheet.personToTransfersMap[personId] ? this.balanceSheet.personToTransfersMap[personId].map((transfer) => {
                    let targetDebtor = this.persons.find((person) => person.id === transfer.debtorId);
                    return { id : transfer.debtorId,name : targetDebtor.getFullName(),amount : transfer.amount}
                }) : []
            });
        })
        return obj;
    }
    getPersons(){
        return this.persons.map((person) => {
            return {
            id : person.id,
            name : person.getFullName(),
        }});
    }
}

class Person {
    id;
    firstName;
    lastName;
    constructor(personDetails){
        let { firstName, lastName } = personDetails;
        this.firstName = firstName;
        this.lastName = lastName;
        this.id = generateId();
    }
    getFullName(){
        return this.firstName + ' ' + this.lastName;
    }
}

class Expense {
    id;
    description;
    amount;
    distributionStrategy;
    paidBy;
    personsInvolved;
    date;
    constructor({ description, amount, date, paidBy , splitMethod,personsInvolved }){
        this.id = generateId();
        this.description = description;
        this.amount = amount;
        this.date = date;
        this.paidBy = paidBy;
        this.personsInvolved = personsInvolved;
        this.distributionStrategy = distributionStrategyBuilder(splitMethod);
    }
}

class BalanceSheet {
    personToBalanceMap = {};
    personToTransfersMap = {};
    constructor(persons){
        persons.forEach(person => {
            this.personToBalanceMap[person.id] = 0;
            this.personToTransfersMap[person.id] = null;
        })
    }
    resolveDebts() {
        const sortedBalances = Object.entries(this.personToBalanceMap).sort((a, b) => b[1] - a[1]);
        const paymentResolution = {};
        for (const [personId, balance] of sortedBalances) {
          paymentResolution[personId] = [];
          if (balance < 0) {
            let remainingBalance = -balance;
      
            for (const [debtorId, debtorBalance] of sortedBalances) {
              if (debtorBalance > 0 && remainingBalance > 0) {
                const transferAmount = Math.min(debtorBalance, remainingBalance);
                paymentResolution[personId].push({ debtorId: debtorId, amount: transferAmount });
                remainingBalance -= transferAmount;
              }
            }
          }
        }
        this.personToTransfersMap = paymentResolution;
    }
    updateBalanceSheet(personToSplitMap,paidBy){
        let totalMoneyBack = 0;
        Object.keys(personToSplitMap).forEach((personId) => {
            if(String(personId) !== paidBy){
                totalMoneyBack = totalMoneyBack + personToSplitMap[personId];
                this.personToBalanceMap[personId] = this.personToBalanceMap[personId] - personToSplitMap[personId];
            }
        })
        this.personToBalanceMap[paidBy] = this.personToBalanceMap[paidBy] + totalMoneyBack;
        this.resolveDebts();
    }
    refreshBalanceSheet(expenses) {
        // Reset all balances to 0
        Object.keys(this.personToBalanceMap).forEach(personId => {
            this.personToBalanceMap[personId] = 0;
        });

        // Recalculate balances for each expense
        expenses.forEach(expense => {
            let personToSplitMap = expense.distributionStrategy.divide(
                expense.amount, 
                {
                    personsInvolved: expense.personsInvolved,
                    personToAmountMap: expense.personToAmountMap
                }
            );

            // Calculate total money to be received by payer
            let totalMoneyBack = 0;
            Object.keys(personToSplitMap).forEach(personId => {
                if (String(personId) !== expense.paidBy) {
                    totalMoneyBack += personToSplitMap[personId];
                    this.personToBalanceMap[personId] -= personToSplitMap[personId];
                }
            });

            // Add the total money to be received to payer's balance
            this.personToBalanceMap[expense.paidBy] += totalMoneyBack;
        });

        // Resolve debts after recalculating all balances
        this.resolveDebts();
    }
}

class DistributionStrategy {
    divide(amount,meta){
    }
}

class EqualDivideStrategy extends DistributionStrategy {
    name = 'equal';
    divide(amount,{ personsInvolved }){
        let output = {}
        personsInvolved.forEach((personId) => {
            output[personId] = amount / personsInvolved.length
        })
        return output;
    }
}

class UnequalDivideStrategy extends DistributionStrategy {
    name = 'unequal';
    divide(amount,{ personToAmountMap }){
        return personToAmountMap;
    }
}

function distributionStrategyBuilder(stategy){
    switch(stategy){
        case "equal":
            return new EqualDivideStrategy();
        case 'unequal':
            return new UnequalDivideStrategy();
    }
}

function generateId() {
    let id = '';
    const digits = '0123456789';

    for (let i = 0; i < 12; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        id += digits[randomIndex];
    }

    return id;
}

let appManager = null;
function getAppManagerInstance(){
    if(appManager === null){
        appManager = new AppManager();
    }
    return appManager;
}

export default getAppManagerInstance



