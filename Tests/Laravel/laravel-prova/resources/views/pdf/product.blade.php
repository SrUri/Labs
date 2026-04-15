<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        /* Estils del fitxer */
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
        <h2>Fitxa de Prodcute: {{ $product->name }}</h2>
    </div>
    
    <div style="margin-top: 20px;">
        <p><strong>Codi del Producte:</strong> {{ $product->code }}</p>
        <p><strong>Descripció:</strong> {{ $product->description ?? 'Sense descripció disponible' }}</p>
    </div>

    <h3>Categories Assignades</h3>
    <ul>
        {{-- Bucle Forelse de Blade: Itera les categories. Si no n'hi ha cap, mostra l'estat buit (@empty) --}}
        @forelse($product->categories as $cat)
            <li>{{ $cat->name }}</li>
        @empty
            <li>Aquest producte no te categories assignades</li>
        @endforelse
    </ul>

    <h3>Tarifes de preus per data</h3>
    <table>
        <thead>
            <tr>
                <th>Preu Unitari</th>
                <th>Data Inici</th>
                <th>Data Final</th>
            </tr>
        </thead>
        <tbody>
            @forelse($product->rates as $rate)
                <tr>
                    {{-- Formategem el preu i utilitzem Carbon per canviar el format de la data a format Europeu --}}
                    <td>{{ number_format($rate->price, 2) }} €</td>
                    <td>{{ \Carbon\Carbon::parse($rate->date_from)->format('d/m/Y') }}</td>
                    <td>{{ \Carbon\Carbon::parse($rate->date_to)->format('d/m/Y') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" style="text-align:center;">No hi ha tarifes configurades per a aquest producte.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Document generat automàticament pel sistema de gestió d'Studiogenesis.
    </div>
</body>
</html>