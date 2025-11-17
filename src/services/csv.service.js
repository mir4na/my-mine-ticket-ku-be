class CSVService {
  generateAuditCSV(auditData) {
    const lines = [];
    
    lines.push('EVENT AUDIT REPORT');
    lines.push('');
    lines.push('Event Information');
    lines.push(`Event Name,${this.escapeCSV(auditData.event.name)}`);
    lines.push(`Location,${this.escapeCSV(auditData.event.location)}`);
    lines.push(`Start Date,${new Date(auditData.event.startDate).toLocaleString()}`);
    lines.push(`End Date,${new Date(auditData.event.endDate).toLocaleString()}`);
    lines.push(`Status,${auditData.event.status}`);
    lines.push('');
    
    lines.push('TICKET SALES SUMMARY');
    lines.push(`Total Tickets Sold,${auditData.ticketSales.totalTicketsSold}`);
    lines.push(`Gross Revenue,Rp ${auditData.ticketSales.totalRevenue.toLocaleString('id-ID')}`);
    lines.push(`Platform Fee (2.5%),Rp ${auditData.ticketSales.platformFee.toLocaleString('id-ID')}`);
    lines.push(`Net Revenue,Rp ${auditData.ticketSales.netRevenue.toLocaleString('id-ID')}`);
    lines.push('');
    
    lines.push('TICKET TYPES BREAKDOWN');
    lines.push('Ticket Type,Price,Stock,Sold,Revenue');
    auditData.ticketSales.ticketTypes.forEach(tt => {
      lines.push(
        `${this.escapeCSV(tt.name)},` +
        `Rp ${tt.price.toLocaleString('id-ID')},` +
        `${tt.stock},` +
        `${tt.sold},` +
        `Rp ${tt.revenue.toLocaleString('id-ID')}`
      );
    });
    lines.push('');
    
    lines.push('REVENUE SPLIT');
    lines.push('Receiver Email,Percentage,Expected Amount,Total Withdrawn,Status');
    auditData.revenueSplit.forEach(receiver => {
      const totalWithdrawn = receiver.withdrawals
        .filter(w => w.status === 'COMPLETED')
        .reduce((sum, w) => sum + w.amount, 0);
      
      const allCompleted = receiver.withdrawals.length > 0 && 
        receiver.withdrawals.every(w => w.status === 'COMPLETED');
      
      lines.push(
        `${this.escapeCSV(receiver.email)},` +
        `${receiver.percentage}%,` +
        `Rp ${receiver.expectedAmount.toLocaleString('id-ID')},` +
        `Rp ${totalWithdrawn.toLocaleString('id-ID')},` +
        `${allCompleted ? 'Completed' : 'Pending'}`
      );
    });
    lines.push('');
    
    lines.push('WITHDRAWAL DETAILS');
    lines.push('Receiver Email,Amount,Status,Date');
    auditData.revenueSplit.forEach(receiver => {
      receiver.withdrawals.forEach(w => {
        lines.push(
          `${this.escapeCSV(receiver.email)},` +
          `Rp ${w.amount.toLocaleString('id-ID')},` +
          `${w.status},` +
          `${new Date(w.createdAt).toLocaleString()}`
        );
      });
    });
    lines.push('');
    
    lines.push('TRANSACTION LIST');
    lines.push('Transaction ID,Buyer,Ticket Type,Amount,Date');
    auditData.transactions.forEach(tx => {
      lines.push(
        `${tx.id},` +
        `${this.escapeCSV(tx.buyer)},` +
        `${this.escapeCSV(tx.ticketType)},` +
        `Rp ${tx.amount.toLocaleString('id-ID')},` +
        `${new Date(tx.date).toLocaleString()}`
      );
    });
    
    return lines.join('\n');
  }

  escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }
}

export const csvService = new CSVService();