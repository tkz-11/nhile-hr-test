# NhiLe HR Backend (Culture OS)

Backend for the NhiLe HR system, built with **FastAPI**, **Supabase**, and **SQLAlchemy**.

## Setup Local Environment

1. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in the values.

4. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation
Once running, the API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
