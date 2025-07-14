import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Member } from '@/types/member';
import { formatDate } from '@/utils/date';

export const exportToPDF = (
  activeTab: string,
  members: Member[],
  currentMonthRevenue: number,
  lastMonthRevenue: number,
  dashboardData: any
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Gym Reports', 20, 20);
  doc.setFontSize(12);
  doc.text(`Generated on: ${formatDate(new Date())}`, 20, 30);
  
  // Add member list if on members tab
  if (activeTab === 'members') {
    doc.setFontSize(16);
    doc.text('Member List', 20, 50);
    
    const memberData = members.map(member => [
      member.user_id,
      member.name,
      member.phone,
      member.plan,
      member.status.charAt(0).toUpperCase() + member.status.slice(1),
      new Date(member.join_date).toLocaleDateString()
    ]);
    
    autoTable(doc, {
      head: [['Member ID', 'Name', 'Phone', 'Plan', 'Status', 'Join Date']],
      body: memberData,
      startY: 60,
    });
  } else {
    // Add financial summary
    doc.setFontSize(16);
    doc.text('Financial Summary', 20, 50);
    
    const summaryData = [
      ['This Month Revenue', `₹${currentMonthRevenue.toLocaleString()}`],
      ['Last Month Revenue', `₹${lastMonthRevenue.toLocaleString()}`],
      ['Total Members', dashboardData.totalMembers.toString()],
      ['Active Members', dashboardData.activeMembers.toString()],
      ['New Members This Month', dashboardData.newMembersThisMonth.toString()]
    ];
    
    autoTable(doc, {
      body: summaryData,
      startY: 60,
    });
  }
  
  doc.save(`gym-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (
  activeTab: string,
  members: Member[],
  currentMonthRevenue: number,
  lastMonthRevenue: number,
  dashboardData: any
) => {
  let data;
  let filename;
  
  if (activeTab === 'members') {
    data = members.map(member => ({
      'Member ID': member.user_id,
      'Name': member.name,
      'Phone': member.phone,
      'Plan': member.plan,
      'Status': member.status.charAt(0).toUpperCase() + member.status.slice(1),
      'Join Date': new Date(member.join_date).toLocaleDateString(),
      'Last Payment': member.last_payment ? new Date(member.last_payment).toLocaleDateString() : 'N/A'
    }));
    filename = 'gym-members';
  } else {
    data = [
      { 'Metric': 'This Month Revenue', 'Value': `₹${currentMonthRevenue.toLocaleString()}` },
      { 'Metric': 'Last Month Revenue', 'Value': `₹${lastMonthRevenue.toLocaleString()}` },
      { 'Metric': 'Total Members', 'Value': dashboardData.totalMembers },
      { 'Metric': 'Active Members', 'Value': dashboardData.activeMembers },
      { 'Metric': 'New Members This Month', 'Value': dashboardData.newMembersThisMonth }
    ];
    filename = 'gym-reports';
  }
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
};