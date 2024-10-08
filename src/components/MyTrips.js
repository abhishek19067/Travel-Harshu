import React, { useEffect, useState } from 'react';
import Navbar from "../components/Navbar";
import axios from 'axios';
import ConfirmationModal from '../components/ConfirmationModal'; 
import './BookingsTable.css'; 
import { useNavigate } from 'react-router-dom'; 
import 'font-awesome/css/font-awesome.min.css';

const BookingsTable = () => {
    const [bookings, setBookings] = useState([]);
    const [displayedBookings, setDisplayedBookings] = useState([]);
    const [loggedInUsername, setLoggedInUsername] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [selectedBookings, setSelectedBookings] = useState([]);
    const navigate = useNavigate(); 

    useEffect(() => {
        const username = localStorage.getItem('username');
        if (username) {
            setLoggedInUsername(username);
            axios.get(`http://localhost:5000/api/bookings?username=${username}`)
                .then(response => {
                    setBookings(response.data);
                    setDisplayedBookings(response.data);
                })
                .catch(error => console.error('Error fetching data:', error));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const userBookings = displayedBookings.filter(booking => booking.username === loggedInUsername);

    const handleBookingSelection = (bookingId) => {
        setSelectedBookings(prev => {
            if (prev.includes(bookingId)) {
                return prev.filter(id => id !== bookingId);
            } else {
                return [...prev, bookingId];
            }
        });
    };

    const calculateTotalAmount = () => {
        const total = selectedBookings.reduce((acc, bookingId) => {
            const booking = displayedBookings.find(b => b.id === bookingId);
            return acc + (booking.price || 0);
        }, 0);
        const gst = total * 0.05; // 5% GST
        return total + gst; // Final amount
    };

    const handleDelete = (id) => {
        setBookingToDelete(id);
        setIsConfirmationVisible(true);
    };

    const confirmDelete = () => {
        setDisplayedBookings(prev => prev.filter(booking => booking.id !== bookingToDelete));
        setIsConfirmationVisible(false);
    };

    const cancelDelete = () => {
        setIsConfirmationVisible(false);
    };

    const totalAmount = calculateTotalAmount();

    const handlePayment = () => {
        const options = {
            key: 'YOUR_RAZORPAY_KEY_ID', // Enter the Key ID generated from the Razorpay Dashboard
            amount: totalAmount * 100, // Amount is in paise, so multiply by 100
            currency: 'INR',
            name: 'Your Company Name',
            description: 'Payment for bookings',
            handler: function (response) {
                console.log('Payment successful:', response);
            },
            prefill: {
                name: loggedInUsername,
                email: '', // Add user's email if available
                contact: '', // Add user's contact if available
            },
            notes: {
                bookingIds: selectedBookings, // Add selected booking IDs
            },
            theme: {
                color: '#F37254', // Change color as needed
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };

   

    const createTicket = (booking) => {
        // Here, you can save the ticket data, e.g., sending it to an API
        axios.post('http://localhost:5000/api/tickets', {
            username: loggedInUsername,
            bookingId: booking.id,
            tripName: booking.trip_name,
            adults: booking.adults,
            children: booking.children,
            bookingDate: booking.booking_date,
            price: booking.price,
        })
        .then(response => {
            console.log('Ticket created:', response.data);
            navigate(`/view-ticket/${response.data.id}`); // Navigate to the ticket view page after creating
        })
        .catch(error => console.error('Error creating ticket:', error));
    };

    const viewTicket = (bookingId) => {
        // Navigate to ticket view page with booking ID
        navigate(`/view-ticket/${bookingId}`);
    };

    return (
        <div>
            <Navbar />
            {loggedInUsername ? (
                <div className="bookings-container">
                    <h1 className="bookings-title">Your Bookings</h1>
                    <div className="card bookings-card">
                        
                        <table className="bookings-table">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>St No</th>
                                    <th>Booking Name</th>
                                    <th>Adults</th>
                                    <th>Children</th>
                                    <th>Booking Date</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userBookings.length > 0 ? (
                                    userBookings.map((booking, index) => (
                                        <tr key={booking.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBookings.includes(booking.id)}
                                                    onChange={() => handleBookingSelection(booking.id)}
                                                />
                                            </td>
                                            <td>{index + 1}</td>
                                            <td>{booking.trip_name}</td>
                                            <td>{booking.adults}</td>
                                            <td>{booking.children}</td>
                                            <td>
                                                {new Date(booking.booking_date).toLocaleDateString('en-US', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td>${booking.price.toFixed(2)}</td>
                                            <td>
                                                <button 
                                                   onClick={() => viewTicket(booking.id)} // Pass booking ID
                                                // Pass booking object
                                                    className="bg-info" 
                                                    title="View Ticket"
                                                >
                                                    <i className="fa fa-eye" aria-hidden="true"></i> View
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(booking.id)} 
                                                    className="bg-dark" 
                                                    title="Delete"
                                                >
                                                    <i className="fa fa-trash" aria-hidden="true"></i> Trash
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8">No bookings found for your account.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="total-amount">
                            <h2>Total Amount: ₹{totalAmount.toFixed(2)}</h2>
                        </div>
                        
                        {totalAmount > 0 && ( // Conditionally render the payment button
                            <button className="payment-button" onClick={handlePayment}>Proceed to Payment</button>
                        )}
                    </div>
                    
                    <ConfirmationModal 
                        isVisible={isConfirmationVisible}
                        onConfirm={confirmDelete}
                        onCancel={cancelDelete}
                        message="Are you sure you want to delete this booking?"
                    />
                </div>
            ) : (
                <p>You must be logged in to view your bookings.</p>
            )}
        </div>
    );
};

export default BookingsTable;
