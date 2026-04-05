from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)
DB = 'nutriapp.db'

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS pacientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            edad INTEGER,
            peso REAL,
            estatura REAL,
            sexo TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        conn.execute('''CREATE TABLE IF NOT EXISTS planes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            paciente_id INTEGER,
            kcal_objetivo REAL,
            proteina_g_kg REAL,
            grasa_g_kg REAL,
            equivalentes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(paciente_id) REFERENCES pacientes(id)
        )''')
        conn.commit()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/pacientes', methods=['GET'])
def get_pacientes():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM pacientes ORDER BY created_at DESC').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/pacientes', methods=['POST'])
def crear_paciente():
    data = request.json
    with get_db() as conn:
        cur = conn.execute(
            'INSERT INTO pacientes (nombre, edad, peso, estatura, sexo) VALUES (?,?,?,?,?)',
            (data['nombre'], data['edad'], data['peso'], data['estatura'], data['sexo'])
        )
        conn.commit()
        row = conn.execute('SELECT * FROM pacientes WHERE id=?', (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201

@app.route('/api/pacientes/<int:pid>', methods=['DELETE'])
def eliminar_paciente(pid):
    with get_db() as conn:
        conn.execute('DELETE FROM pacientes WHERE id=?', (pid,))
        conn.commit()
    return jsonify({'ok': True})

@app.route('/api/planes', methods=['POST'])
def guardar_plan():
    data = request.json
    import json
    with get_db() as conn:
        cur = conn.execute(
            'INSERT INTO planes (paciente_id, kcal_objetivo, proteina_g_kg, grasa_g_kg, equivalentes) VALUES (?,?,?,?,?)',
            (data['paciente_id'], data['kcal_objetivo'], data['proteina_g_kg'], data['grasa_g_kg'], json.dumps(data['equivalentes']))
        )
        conn.commit()
    return jsonify({'id': cur.lastrowid}), 201

@app.route('/api/planes/<int:pid>', methods=['GET'])
def get_plan(pid):
    import json
    with get_db() as conn:
        row = conn.execute('SELECT * FROM planes WHERE paciente_id=? ORDER BY created_at DESC LIMIT 1', (pid,)).fetchone()
    if row:
        d = dict(row)
        d['equivalentes'] = json.loads(d['equivalentes'])
        return jsonify(d)
    return jsonify(None)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
