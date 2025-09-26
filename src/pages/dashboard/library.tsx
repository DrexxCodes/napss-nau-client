"use client"

import React, { useState, useEffect } from 'react'
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import Header from '../../components/Header'
import HamburgerNav from '../../components/HamburgerNav'
import Footer from '../../components/Footer'
import './library.css'

interface LibraryBook {
  id: string
  bookName: string
  borrowedDate: Timestamp
  returnedDate?: Timestamp
  issuedBy: string
}

const Library: React.FC = () => {
  const [user] = useAuthState(auth)
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!user) return

    const libraryRef = collection(db, 'users', user.uid, 'library')
    const q = query(libraryRef)

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData: LibraryBook[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        booksData.push({
          id: doc.id,
          bookName: data.bookName,
          borrowedDate: data.borrowedDate,
          returnedDate: data.returnedDate,
          issuedBy: data.issuedBy
        } as LibraryBook)
      })
      setBooks(booksData)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching library data:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const calculateDaysOverdue = (borrowedDate: Timestamp): number => {
    const borrowed = borrowedDate.toDate()
    const today = new Date()
    const diffTime = today.getTime() - borrowed.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays - 7 // 7 days is the borrowing period
  }

  const getDaysLeft = (borrowedDate: Timestamp): number => {
    const borrowed = borrowedDate.toDate()
    const today = new Date()
    const diffTime = today.getTime() - borrowed.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, 7 - diffDays) // Days left out of 7, minimum 0
  }

  const isOverdue = (borrowedDate: Timestamp, returnedDate?: Timestamp): boolean => {
    // If book is already returned, it's not overdue
    if (returnedDate) return false
    return calculateDaysOverdue(borrowedDate) > 0
  }

  const isReturned = (returnedDate?: Timestamp): boolean => {
    return returnedDate !== undefined
  }

  const getDaysBorrowed = (borrowedDate: Timestamp, returnedDate?: Timestamp): number => {
    const borrowed = borrowedDate.toDate()
    const returned = returnedDate ? returnedDate.toDate() : new Date()
    const diffTime = returned.getTime() - borrowed.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getBookStatus = (book: LibraryBook) => {
    if (isReturned(book.returnedDate)) {
      const daysBorrowed = getDaysBorrowed(book.borrowedDate, book.returnedDate)
      if (daysBorrowed > 7) {
        return {
          text: `Returned Late (${daysBorrowed} days)`,
          className: 'returned-late'
        }
      } else {
        return {
          text: `Returned On Time (${daysBorrowed} days)`,
          className: 'returned-on-time'
        }
      }
    } else if (isOverdue(book.borrowedDate, book.returnedDate)) {
      return {
        text: `Overdue (${calculateDaysOverdue(book.borrowedDate)} days)`,
        className: 'overdue'
      }
    } else {
      return {
        text: `${getDaysLeft(book.borrowedDate)} days left`,
        className: 'on-time'
      }
    }
  }

  const handleBookClick = (book: LibraryBook) => {
    setSelectedBook(book)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedBook(null)
  }

  const formatTimestamp = (timestamp: Timestamp): string => {
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimestampWithTime = (timestamp: Timestamp): string => {
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRowClassName = (book: LibraryBook): string => {
    if (isReturned(book.returnedDate)) {
      const daysBorrowed = getDaysBorrowed(book.borrowedDate, book.returnedDate)
      return daysBorrowed > 7 ? 'returned-late' : 'returned-on-time'
    } else if (isOverdue(book.borrowedDate, book.returnedDate)) {
      return 'overdue'
    } else {
      return 'on-time'
    }
  }

  if (loading) {
    return (
      <div className="library-loading">
        <div className="loading-spinner"></div>
        <p>Loading your library...</p>
      </div>
    )
  }

  return (
      <div className="library-container">
          <Header />
        <HamburgerNav />
      <div className="library-header">
        <h1>My Library</h1>
        <p>Manage your borrowed books</p>
      </div>

      <div className="library-content">
        <div className="books-list-container">
          <div className="books-header">
            <h2>Borrowed Books</h2>
            <div className="status-legend">
              <div className="legend-item">
                <div className="legend-color green"></div>
                <span>On Time / Returned On Time</span>
              </div>
              <div className="legend-item">
                <div className="legend-color red"></div>
                <span>Overdue / Returned Late</span>
              </div>
              <div className="legend-item">
                <div className="legend-color blue"></div>
                <span>Returned</span>
              </div>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="no-books">
              <p>No books borrowed yet</p>
            </div>
          ) : (
            <div className="books-table">
              <div className="table-header">
                <div className="header-cell">Book Name</div>
                <div className="header-cell">Borrowed Date</div>
                <div className="header-cell">Status</div>
              </div>
              
              {books.map((book) => {
                const status = getBookStatus(book)
                return (
                  <div
                    key={book.id}
                    className={`table-row ${getRowClassName(book)}`}
                    onClick={() => handleBookClick(book)}
                  >
                    <div className="cell book-name">{book.bookName}</div>
                    <div className="cell">{formatTimestamp(book.borrowedDate)}</div>
                    <div className="cell status">
                      <span className={`status-badge ${status.className}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Desktop Details Panel */}
        <div className="book-details-container desktop-only">
          {selectedBook ? (
            <div className="book-details">
              <h3>Book Details</h3>
              <div className="detail-item">
                <label>Book Name:</label>
                <span>{selectedBook.bookName}</span>
              </div>
              <div className="detail-item">
                <label>Borrowed Date:</label>
                <span>{formatTimestampWithTime(selectedBook.borrowedDate)}</span>
              </div>
              <div className="detail-item">
                <label>Issued By:</label>
                <span>{selectedBook.issuedBy}</span>
              </div>
              {selectedBook.returnedDate ? (
                <div className="detail-item">
                  <label>Returned Date:</label>
                  <span>{formatTimestampWithTime(selectedBook.returnedDate)}</span>
                </div>
              ) : (
                <div className="detail-item">
                  <label>Return Status:</label>
                  <span>Not Yet Returned</span>
                </div>
              )}
              <div className="detail-item">
                <label>Total Days Borrowed:</label>
                <span>{getDaysBorrowed(selectedBook.borrowedDate, selectedBook.returnedDate)} days</span>
              </div>
              
              <div className="status-message">
                {isReturned(selectedBook.returnedDate) ? (
                  getDaysBorrowed(selectedBook.borrowedDate, selectedBook.returnedDate) > 7 ? (
                    <div className="returned-late-message">
                      <p>📚 Book was returned late</p>
                      <p>Total borrowed: {getDaysBorrowed(selectedBook.borrowedDate, selectedBook.returnedDate)} days (7-day limit exceeded)</p>
                    </div>
                  ) : (
                    <div className="returned-on-time-message">
                      <p>✅ Book was returned on time</p>
                      <p>Total borrowed: {getDaysBorrowed(selectedBook.borrowedDate, selectedBook.returnedDate)} days</p>
                    </div>
                  )
                ) : isOverdue(selectedBook.borrowedDate, selectedBook.returnedDate) ? (
                  <div className="overdue-message">
                    <p>⚠️ You're meant to have returned this book</p>
                    <p>Overdue by {calculateDaysOverdue(selectedBook.borrowedDate)} days</p>
                    <p>Please return as soon as possible</p>
                  </div>
                ) : (
                  <div className="on-time-message">
                    <p>✅ You still have time</p>
                    <p>{getDaysLeft(selectedBook.borrowedDate)} days left to return</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a book to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Modal */}
      {showModal && selectedBook && (
        <div className="modal-overlay mobile-only">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Book Details</h3>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-item">
                <label>Book Name:</label>
                <span>{selectedBook.bookName}</span>
              </div>
              <div className="detail-item">
                <label>Borrowed Date:</label>
                <span>{formatTimestampWithTime(selectedBook.borrowedDate)}</span>
              </div>
              <div className="detail-item">
                <label>Issued By:</label>
                <span>{selectedBook.issuedBy}</span>
              </div>
              {selectedBook.returnedDate ? (
                <div className="detail-item">
                  <label>Returned Date:</label>
                  <span>{formatTimestampWithTime(selectedBook.returnedDate)}</span>
                </div>
              ) : (
                <div className="detail-item">
                  <label>Return Status:</label>
                  <span>Not Yet Returned</span>
                </div>
              )}
              <div className="detail-item">
                <label>Total Days Borrowed:</label>
                <span>{getDaysBorrowed(selectedBook.borrowedDate, selectedBook.returnedDate)} days</span>
              </div>
              
              <div className="status-message">
                {isReturned(selectedBook.returnedDate) ? (
                  getDaysBorrowed(selectedBook.borrowedDate, selectedBook.returnedDate) > 7 ? (
                    <div className="returned-late-message">
                      <p>📚 Book was returned late</p>
                      <p>Total borrowed: {getDaysBorrowed(selectedBook.borrowedDate, selectedBook.returnedDate)} days (7-day limit exceeded)</p>
                    </div>
                  ) : (
                    <div className="returned-on-time-message">
                      <p>✅ Book was returned on time</p>
                      <p>Total borrowed: {getDaysBorrowed(selectedBook.borrowedDate, selectedBook.returnedDate)} days</p>
                    </div>
                  )
                ) : isOverdue(selectedBook.borrowedDate, selectedBook.returnedDate) ? (
                  <div className="overdue-message">
                    <p>⚠️ You're meant to have returned this book</p>
                    <p>Overdue by {calculateDaysOverdue(selectedBook.borrowedDate)} days</p>
                    <p>Please return as soon as possible</p>
                  </div>
                ) : (
                  <div className="on-time-message">
                    <p>✅ You still have time</p>
                    <p>{getDaysLeft(selectedBook.borrowedDate)} days left to return</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="back-button" onClick={closeModal}>
                Back to List
              </button>
            </div>
          </div>
        </div>
      )}
<Footer />
    </div>
  )
}

export default Library