<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Studiogenesis ERP</title>
    
    {{-- Directives de Vite: S'encarreguen de compilar i injectar React i SASS dins d'aquest document HTML en temps real --}}
    @viteReactRefresh
    @vite(['resources/sass/app.scss', 'resources/js/app.jsx'])
</head>
<body class="bg-light">
    <div id="root"></div>
</body>
</html>