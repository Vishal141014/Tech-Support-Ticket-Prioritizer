import React from 'react';
import { useParams } from 'react-router-dom';

function TicketDetail() {
  const { id } = useParams();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Ticket Detail</h1>
      <p>Viewing ticket: {id}</p>
      <p>This is a placeholder for ticket details.</p>
    </div>
  );
}

export default TicketDetail; 