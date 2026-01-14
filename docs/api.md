# Book Club API Documentation

## Overview

This document defines the REST API contracts for the Book Club application. These contracts serve as the bridge between the frontend and backend, ensuring consistent data exchange.

**Base URL:** `/api/v1`

**Content-Type:** `application/json`

---

## Endpoints

### 1. Get All Books (Homepage Sections)

Fetches book listings organized by section for the homepage.

**Endpoint:** `GET /books`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|--------|----------|--------------------------------------------------|
| section | string | No | Filter by section: `trending`, `newArrivals`, `popular`. If omitted, returns all sections. |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "trending": [
      {
        "id": 1,
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "image": "https://example.com/image.jpg"
      }
    ],
    "newArrivals": [
      {
        "id": 7,
        "title": "Atomic Habits",
        "author": "James Clear",
        "image": "https://example.com/image.jpg"
      }
    ],
    "popular": [
      {
        "id": 2,
        "title": "1984",
        "author": "George Orwell",
        "image": "https://example.com/image.jpg"
      }
    ]
  }
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "success": false,
  "error": {
    "code": "FETCH_FAILED",
    "message": "Failed to fetch books. Please try again later."
  }
}
```

---

### 2. Get Book by ID

Fetches detailed information about a specific book.

**Endpoint:** `GET /books/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|--------|----------|----------------------|
| id | number | Yes | The unique book ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "genre": "Classic Fiction",
    "image": "https://example.com/image.jpg",
    "description": "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald...",
    "year": "1925",
    "pages": 180,
    "language": "English",
    "rating": 5
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "Book with ID 999 not found."
  }
}
```

---

### 3. Create Book Listing

Creates a new book listing for lending, borrowing, or selling.

**Endpoint:** `POST /books`

**Request Body:**

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "category": "Technology",
  "listingType": "lend",
  "price": "",
  "description": "A handbook of agile software craftsmanship...",
  "images": ["data:image/jpeg;base64,..."],
  "whatsappNumber": "+1234567890"
}
```

**Field Validation:**
| Field | Type | Required | Constraints |
|----------------|----------|----------|----------------------------------------------|
| title | string | Yes | Max 100 characters |
| author | string | Yes | Max 100 characters |
| category | string | Yes | One of: Self-Help, Fiction, Non-Fiction, Technology, Philosophy, Romance, Mystery, Biography, Science, History |
| listingType | string | Yes | One of: `lend`, `borrow`, `sell` |
| price | string | Conditional | Required when listingType is `sell` |
| description | string | No | Max 1000 characters |
| images | string[] | Yes | At least 1, max 3 images (base64 or URLs) |
| whatsappNumber | string | Yes | Valid phone number format |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "genre": "Technology",
    "image": "https://example.com/uploaded-image.jpg",
    "description": "A handbook of agile software craftsmanship...",
    "year": "2026",
    "pages": 0,
    "language": "English",
    "rating": 0
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "title", "message": "Title is required" },
      { "field": "images", "message": "At least one image is required" }
    ]
  }
}
```

---

### 4. Borrow Book Request

Submits a request to borrow a book from another user.

**Endpoint:** `POST /borrow`

**Request Body:**

```json
{
  "bookId": 1,
  "borrowerName": "John Doe",
  "borrowerEmail": "john@example.com",
  "borrowerPhone": "+1234567890",
  "message": "I would love to borrow this book for 2 weeks."
}
```

**Field Validation:**
| Field | Type | Required | Constraints |
|---------------|--------|----------|---------------------------|
| bookId | number | Yes | Must exist in database |
| borrowerName | string | Yes | Max 100 characters |
| borrowerEmail | string | Yes | Valid email format |
| borrowerPhone | string | Yes | Valid phone number format |
| message | string | No | Max 500 characters |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "requestId": "br-12345",
    "bookId": 1,
    "status": "pending",
    "createdAt": "2026-01-14T10:30:00Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "Book with ID 999 not found."
  }
}
```

---

### 5. Join Book Club

Registers a user to join the book club community.

**Endpoint:** `POST /join`

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "interests": ["Fiction", "Self-Help", "Technology"]
}
```

**Field Validation:**
| Field | Type | Required | Constraints |
|-----------|----------|----------|-------------------------------------|
| name | string | Yes | Max 100 characters |
| email | string | Yes | Valid email, must be unique |
| phone | string | No | Valid phone number format |
| interests | string[] | No | Array of valid category names |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "memberId": "mem-67890",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "joinedAt": "2026-01-14T10:30:00Z"
  }
}
```

**Error Response (409 Conflict):**

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "A member with this email already exists."
  }
}
```

---

## Common Error Codes

| Code             | HTTP Status | Description                    |
| ---------------- | ----------- | ------------------------------ |
| VALIDATION_ERROR | 400         | Request body failed validation |
| NOT_FOUND        | 404         | Requested resource not found   |
| BOOK_NOT_FOUND   | 404         | Specific book ID not found     |
| EMAIL_EXISTS     | 409         | Email already registered       |
| FETCH_FAILED     | 500         | Server failed to fetch data    |
| SERVER_ERROR     | 500         | Generic server error           |

---

## Response Wrapper

All API responses follow a consistent wrapper format:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [] // Optional: field-level errors
  }
}
```

---

## Rate Limiting

- **Limit:** 100 requests per minute per IP
- **Headers returned:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Versioning

API versions are included in the URL path (`/api/v1/`). When breaking changes are introduced, a new version will be released while maintaining backward compatibility for existing versions.
