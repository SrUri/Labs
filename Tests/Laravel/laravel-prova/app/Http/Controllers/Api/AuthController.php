<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // Intentem iniciar sessió
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Credencials incorrectes'], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        
        // Creaem token de seguretat
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Hola de nou, ' . $user->name,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        // Borrem token de sessió
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sessió tancada correctament']);
    }
}