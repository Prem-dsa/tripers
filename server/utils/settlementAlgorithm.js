/**
 * Minimum Cash Flow Algorithm
 * Minimizes the number of transactions needed to settle all debts in a group.
 *
 * @param {Array} expenses - Array of expense objects with splits
 * @param {Array} memberIds - Array of member user IDs (strings)
 * @returns {Array} transactions - [{from, to, amount}]
 */

function calculateNetBalances(expenses, memberIds) {
  const balances = {};
  memberIds.forEach((id) => { balances[id] = 0; });

  expenses.forEach((expense) => {
    const paidById = expense.paidBy.toString();
    if (balances[paidById] !== undefined) {
      balances[paidById] += expense.amount;
    }
    expense.splits.forEach((split) => {
      const userId = split.user.toString();
      if (balances[userId] !== undefined) {
        balances[userId] -= split.amount;
      }
    });
  });

  return balances;
}

function minimizeCashFlow(balances) {
  const transactions = [];
  const amounts = Object.entries(balances).map(([id, bal]) => ({ id, amount: Math.round(bal * 100) / 100 }));

  const getMax = (arr) => arr.reduce((max, curr) => (curr.amount > max.amount ? curr : max));
  const getMin = (arr) => arr.reduce((min, curr) => (curr.amount < min.amount ? curr : min));

  const remaining = amounts.filter((a) => Math.abs(a.amount) > 0.01);

  while (remaining.length > 1) {
    const maxCreditor = getMax(remaining);
    const maxDebtor = getMin(remaining);

    if (Math.abs(maxCreditor.amount) < 0.01 || Math.abs(maxDebtor.amount) < 0.01) break;

    let settledAmount = Math.min(maxCreditor.amount, -maxDebtor.amount);
    settledAmount = Math.round(settledAmount * 100) / 100;

    transactions.push({
      from: maxDebtor.id,
      to: maxCreditor.id,
      amount: settledAmount,
    });

    maxCreditor.amount -= settledAmount;
    maxDebtor.amount += settledAmount;

    // Remove settled members
    const toRemove = remaining.filter((a) => Math.abs(a.amount) < 0.01);
    toRemove.forEach((item) => {
      const idx = remaining.indexOf(item);
      if (idx > -1) remaining.splice(idx, 1);
    });
  }

  return transactions;
}

function calculateSettlements(expenses, members) {
  const memberIds = members.map((m) => (m.user ? (m.user._id || m.user).toString() : m.toString()));
  const balances = calculateNetBalances(expenses, memberIds);
  const transactions = minimizeCashFlow(balances);
  return { balances, transactions };
}

function getMemberStats(expenses, userId) {
  const uid = userId.toString();
  let totalPaid = 0;
  let totalShare = 0;

  expenses.forEach((expense) => {
    if (expense.paidBy.toString() === uid) {
      totalPaid += expense.amount;
    }
    const split = expense.splits.find((s) => s.user.toString() === uid);
    if (split) {
      totalShare += split.amount;
    }
  });

  const netBalance = totalPaid - totalShare;
  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalShare: Math.round(totalShare * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    toReceive: netBalance > 0 ? Math.round(netBalance * 100) / 100 : 0,
    toPay: netBalance < 0 ? Math.round(-netBalance * 100) / 100 : 0,
  };
}

module.exports = { calculateSettlements, getMemberStats, calculateNetBalances };
