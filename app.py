import os
import logging

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET") or "dev-secret-key-change-in-production"
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# PersistentVolume base path (can be overridden)
instance_path = os.environ.get("FLASK_INSTANCE_PATH", "/data/instance")
os.makedirs(instance_path, exist_ok=True)

# Determine database path
default_db_path = os.path.join(instance_path, "app.db")
database_url = os.environ.get("DATABASE_URL", f"sqlite:///{default_db_path}")
app.config["SQLALCHEMY_DATABASE_URI"] = database_url

# Database engine options
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the app with the extension
db.init_app(app)

with app.app_context():
    # Import models and routes
    import models  # noqa: F401
    import routes  # noqa: F401
    
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
