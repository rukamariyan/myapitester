# API Tester - Postman Clone

A comprehensive API testing web application built with Flask and SQLite, featuring user authentication, request collections, environment management, and request history tracking.

## Features

- **User Authentication**: Username/password registration and login system
- **HTTP Request Testing**: Support for GET, POST, PUT, DELETE, PATCH methods
- **Request Collections**: Organize API requests into collections
- **Environment Variables**: Manage different environments with variable substitution
- **Request History**: Track all executed requests with response details
- **Multi-User Support**: Complete data isolation per user account

## Local Setup Instructions

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

### Installation Steps

1. **Clone or Download the Project**
   ```bash
   # If you have the files, extract them to a folder named 'api-tester'
   cd api-tester
   ```

2. **Create a Virtual Environment** (Recommended)
   ```bash
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies**
   
   Option A - Using requirements.txt (Recommended):
   ```bash
   # Create a requirements.txt file with the following content:
   pip install -r requirements.txt
   ```
   
   Option B - Manual installation:
   ```bash
   pip install flask flask-sqlalchemy flask-login werkzeug gunicorn requests
   ```

4. **Set Environment Variables** (Optional)
   ```bash
   # On Windows:
   set SESSION_SECRET=your-secret-key-here
   
   # On macOS/Linux:
   export SESSION_SECRET=your-secret-key-here
   ```

5. **Initialize Database**
   ```bash
   # Create instance directory for SQLite database
   mkdir -p instance
   ```

6. **Run the Application**
   ```bash
   # Development mode
   python main.py
   
   # Or using Flask directly
   flask --app main run --debug
   
   # Or using Gunicorn (production-like)
   gunicorn --bind 127.0.0.1:5000 --reload main:app
   ```

7. **Access the Application**
   - Open your web browser
   - Navigate to: `http://localhost:5000`
   - Create an account and start testing APIs!

## Project Structure

```
api-tester/
├── main.py              # Application entry point
├── app.py               # Flask app configuration
├── models.py            # Database models
├── routes.py            # Application routes
├── auth.py              # Authentication logic
├── api_client.py        # HTTP request client
├── templates/           # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── landing.html
│   ├── collections.html
│   ├── environments.html
│   └── history.html
├── static/              # CSS and JavaScript
│   ├── css/
│   └── js/
├── instance/            # SQLite database location
└── README.md           # This file
```

## Usage

1. **Create Account**: Sign up with username, email, and password
2. **Login**: Access your personal dashboard
3. **Send Requests**: Use the main interface to test API endpoints
4. **Manage Collections**: Organize related requests together
5. **Environment Variables**: Set up different environments (dev, staging, prod)
6. **View History**: Track all your API requests and responses

## Database

The application uses SQLite by default, which creates a file at `instance/api_tester.db`. No additional database setup required!

## Troubleshooting

- **Port already in use**: Change the port in `main.py` or kill the process using port 5000
- **Module not found**: Ensure you've activated your virtual environment and installed dependencies
- **Database errors**: Delete `instance/api_tester.db` to reset the database

## Development

To modify the application:
- Edit templates in `templates/` for UI changes
- Update models in `models.py` for database schema changes
- Add routes in `routes.py` for new functionality
- Modify styles in `static/css/style.css`

The application will automatically reload in debug mode when you make changes.