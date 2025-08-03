from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
import json


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    collections = db.relationship('Collection', backref='user', lazy=True, cascade='all, delete-orphan')
    environments = db.relationship('Environment', backref='user', lazy=True, cascade='all, delete-orphan')
    request_history = db.relationship('RequestHistory', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches the hash"""
        return check_password_hash(self.password_hash, password)

    def get_display_name(self):
        """Get a display name for the user"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        else:
            return self.username

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'display_name': self.get_display_name(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<User {self.username}>'


class Collection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with requests
    requests = db.relationship('ApiRequest', backref='collection', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'requests': [req.to_dict() for req in self.requests]
        }


class ApiRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    method = db.Column(db.String(10), nullable=False, default='GET')
    url = db.Column(db.Text, nullable=False)
    headers = db.Column(db.Text)  # JSON string
    body = db.Column(db.Text)
    body_type = db.Column(db.String(20), default='json')  # json, form, raw
    auth_type = db.Column(db.String(20))  # bearer, apikey, basic
    auth_data = db.Column(db.Text)  # JSON string for auth details
    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_headers(self):
        if self.headers:
            try:
                return json.loads(self.headers)
            except:
                return {}
        return {}

    def set_headers(self, headers_dict):
        self.headers = json.dumps(headers_dict)

    def get_auth_data(self):
        if self.auth_data:
            try:
                return json.loads(self.auth_data)
            except:
                return {}
        return {}

    def set_auth_data(self, auth_dict):
        self.auth_data = json.dumps(auth_dict)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'method': self.method,
            'url': self.url,
            'headers': self.get_headers(),
            'body': self.body,
            'body_type': self.body_type,
            'auth_type': self.auth_type,
            'auth_data': self.get_auth_data(),
            'collection_id': self.collection_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Environment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    variables = db.Column(db.Text)  # JSON string
    is_active = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_variables(self):
        if self.variables:
            try:
                return json.loads(self.variables)
            except:
                return {}
        return {}

    def set_variables(self, variables_dict):
        self.variables = json.dumps(variables_dict)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'variables': self.get_variables(),
            'is_active': self.is_active,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class RequestHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    request_data = db.Column(db.Text, nullable=False)  # JSON string of request
    response_data = db.Column(db.Text)  # JSON string of response
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status_code = db.Column(db.Integer)
    response_time = db.Column(db.Float)  # in seconds
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def get_request_data(self):
        if self.request_data:
            try:
                return json.loads(self.request_data)
            except:
                return {}
        return {}

    def set_request_data(self, request_dict):
        self.request_data = json.dumps(request_dict)

    def get_response_data(self):
        if self.response_data:
            try:
                return json.loads(self.response_data)
            except:
                return {}
        return {}

    def set_response_data(self, response_dict):
        self.response_data = json.dumps(response_dict)

    def to_dict(self):
        return {
            'id': self.id,
            'request_data': self.get_request_data(),
            'response_data': self.get_response_data(),
            'timestamp': self.timestamp.isoformat(),
            'status_code': self.status_code,
            'response_time': self.response_time,
            'user_id': self.user_id
        }