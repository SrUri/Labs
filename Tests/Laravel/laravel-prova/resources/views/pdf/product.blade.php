<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: sans-serif; }
        .header { background: #333; color: white; padding: 10px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; font-size: 10px; color: #777; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Ficha de Producto: {{ $product->name }}</h2>
    </div>
    
    <div style="margin-top: 20px;">
        <p><strong>Código de Producto:</strong> {{ $product->code }}</p>
        <p><strong>Descripción:</strong> {{ $product->description ?? 'Sin descripción disponible' }}</p>
    </div>

    <h3>Categorías Asignadas</h3>
    <ul>
        @forelse($product->categories as $cat)
            <li>{{ $cat->name }}</li>
        @empty
            <li>Este producto no tiene categorías asignadas.</li>
        @endforelse
    </ul>

    <h3>Tarifas de Precios por Fecha</h3>
    <table>
        <thead>
            <tr>
                <th>Precio Unitario</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
            </tr>
        </thead>
        <tbody>
            @forelse($product->rates as $rate)
                <tr>
                    <td>{{ number_format($rate->price, 2) }} €</td>
                    <td>{{ \Carbon\Carbon::parse($rate->date_from)->format('d/m/Y') }}</td>
                    <td>{{ \Carbon\Carbon::parse($rate->date_to)->format('d/m/Y') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" style="text-align:center;">No hay tarifas configuradas para este producto.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Documento generado automáticamente por el sistema de gestión Studiogenesis.
    </div>
</body>
</html>