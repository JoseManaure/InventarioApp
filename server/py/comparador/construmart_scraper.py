# comparador/construmart_scraper.py
from flask import Flask, request, jsonify
from bs4 import BeautifulSoup
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/comparar', methods=['POST'])
def comparar():
    data = request.get_json()
    producto = data.get('producto')

    if not producto:
        return jsonify({'error': 'Falta el nombre del producto'}), 400

    # 1. Buscar en Construmart
    url_busqueda = f'https://www.construmart.cl/search/?text={producto.replace(" ", "+")}'
    headers = {'User-Agent': 'Mozilla/5.0'}

    r = requests.get(url_busqueda, headers=headers)
    soup = BeautifulSoup(r.text, 'html.parser')

    link = soup.select_one('.product-tile-link')
    if not link:
        return jsonify({'error': 'Producto no encontrado en Construmart'}), 404

    url_producto = link['href']
    r2 = requests.get(url_producto, headers=headers)
    soup2 = BeautifulSoup(r2.text, 'html.parser')

    precio_tag = soup2.select_one('.price-wrapper .sales')
    precio = precio_tag.text.strip() if precio_tag else 'No disponible'

    return jsonify({
        'producto': producto,
        'precio_construmart': precio,
        'url': url_producto
    })

if __name__ == '__main__':
    app.run(port=5001)
