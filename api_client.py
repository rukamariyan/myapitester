import requests
import time
import json
from urllib.parse import urlparse
import re


class ApiClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'PostmanClone/1.0'
        })

    def replace_environment_variables(self, text, environment_vars):
        """Replace {{variable}} patterns with environment variable values"""
        if not text or not environment_vars:
            return text
        
        def replace_var(match):
            var_name = match.group(1)
            return str(environment_vars.get(var_name, match.group(0)))
        
        # Replace {{variable}} patterns
        return re.sub(r'\{\{([^}]+)\}\}', replace_var, text)

    def prepare_headers(self, headers_dict, auth_type=None, auth_data=None):
        """Prepare headers including authentication"""
        headers = headers_dict.copy() if headers_dict else {}
        
        if auth_type == 'bearer' and auth_data and 'token' in auth_data:
            headers['Authorization'] = f"Bearer {auth_data['token']}"
        elif auth_type == 'apikey' and auth_data:
            if auth_data.get('in') == 'header':
                headers[auth_data.get('key', 'X-API-Key')] = auth_data.get('value', '')
        
        return headers

    def prepare_url(self, url, auth_type=None, auth_data=None):
        """Prepare URL including API key query parameters"""
        if auth_type == 'apikey' and auth_data and auth_data.get('in') == 'query':
            separator = '&' if '?' in url else '?'
            key = auth_data.get('key', 'api_key')
            value = auth_data.get('value', '')
            url += f"{separator}{key}={value}"
        
        return url

    def send_request(self, method, url, headers=None, body=None, body_type='json', 
                    auth_type=None, auth_data=None, environment_vars=None):
        """Send HTTP request and return response data"""
        start_time = time.time()
        
        try:
            # Replace environment variables
            if environment_vars:
                url = self.replace_environment_variables(url, environment_vars)
                if body:
                    body = self.replace_environment_variables(body, environment_vars)
                if headers:
                    for key, value in headers.items():
                        headers[key] = self.replace_environment_variables(str(value), environment_vars)
                if auth_data:
                    for key, value in auth_data.items():
                        if isinstance(value, str):
                            auth_data[key] = self.replace_environment_variables(value, environment_vars)

            # Prepare headers and URL
            prepared_headers = self.prepare_headers(headers, auth_type, auth_data)
            prepared_url = self.prepare_url(url, auth_type, auth_data)

            # Prepare request data
            request_kwargs = {
                'method': method.upper(),
                'url': prepared_url,
                'headers': prepared_headers,
                'timeout': 30,
                'allow_redirects': True
            }

            # Prepare body based on type
            if body and method.upper() in ['POST', 'PUT', 'PATCH']:
                if body_type == 'json':
                    try:
                        request_kwargs['json'] = json.loads(body)
                    except json.JSONDecodeError:
                        request_kwargs['data'] = body
                        if 'Content-Type' not in prepared_headers:
                            prepared_headers['Content-Type'] = 'application/json'
                elif body_type == 'form':
                    # Parse form data
                    form_data = {}
                    for line in body.split('\n'):
                        if '=' in line:
                            key, value = line.split('=', 1)
                            form_data[key.strip()] = value.strip()
                    request_kwargs['data'] = form_data
                else:  # raw
                    request_kwargs['data'] = body

            # Send request
            response = self.session.request(**request_kwargs)
            response_time = time.time() - start_time

            # Parse response
            response_headers = dict(response.headers)
            
            try:
                # Try to parse as JSON
                response_body = response.json()
                content_type = 'application/json'
            except:
                # Fallback to text
                response_body = response.text
                content_type = response.headers.get('Content-Type', 'text/plain')

            return {
                'success': True,
                'status_code': response.status_code,
                'status_text': response.reason,
                'headers': response_headers,
                'body': response_body,
                'content_type': content_type,
                'response_time': response_time,
                'size': len(response.content),
                'request': {
                    'method': method.upper(),
                    'url': prepared_url,
                    'headers': prepared_headers,
                    'body': body
                }
            }

        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Request timeout',
                'response_time': time.time() - start_time
            }
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'error': 'Connection error - Unable to reach the server',
                'response_time': time.time() - start_time
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'Request error: {str(e)}',
                'response_time': time.time() - start_time
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}',
                'response_time': time.time() - start_time
            }
