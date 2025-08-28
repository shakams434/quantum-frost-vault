// src/pqc/sign-verify.ts

/**
 * Firma un mensaje usando Dilithium2
 * @param message - Mensaje a firmar (Uint8Array)
 * @param secretKey - Clave privada Dilithium2
 * @returns Promise<Uint8Array> - Firma generada
 */
export async function dilithiumSign(message: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
  if (!message || message.length === 0) {
    throw new Error("El mensaje no puede estar vacío");
  }
  
  if (!secretKey || secretKey.length === 0) {
    throw new Error("La clave privada no puede estar vacía");
  }
  
  try {
    // Carga diferida del módulo WASM
    const dilithiumModule = await import('dilithium-crystals');
    
    // Acceder a la API correcta de dilithium-crystals
    const dilithium = dilithiumModule.dilithium;
    
    // dilithium-crystals usa signDetached para firmas separadas
    if (typeof dilithium.signDetached !== 'function') {
      throw new Error("La función signDetached no está disponible en dilithium-crystals");
    }
    
    console.log(`🔐 Firmando mensaje de ${message.length} bytes con clave de ${secretKey.length} bytes`);
    
    // Realizar la firma con signDetached
    const signature = await dilithium.signDetached(message, secretKey);
    
    if (!signature || signature.length === 0) {
      throw new Error("La firma generada está vacía");
    }
    
    console.log(`✅ Firma generada: ${signature.length} bytes`);
    return signature;
    
  } catch (error) {
    console.error('❌ Error en firma Dilithium2:', error);
    throw new Error(`Fallo en firma Dilithium2: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Verifica una firma usando Dilithium2
 * @param message - Mensaje original (Uint8Array)
 * @param signature - Firma a verificar (Uint8Array)
 * @param publicKey - Clave pública Dilithium2
 * @returns Promise<boolean> - true si la firma es válida, false en caso contrario
 */
export async function dilithiumVerify(
  message: Uint8Array, 
  signature: Uint8Array, 
  publicKey: Uint8Array
): Promise<boolean> {
  if (!message || message.length === 0) {
    throw new Error("El mensaje no puede estar vacío");
  }
  
  if (!signature || signature.length === 0) {
    throw new Error("La firma no puede estar vacía");
  }
  
  if (!publicKey || publicKey.length === 0) {
    throw new Error("La clave pública no puede estar vacía");
  }
  
  try {
    // Carga diferida del módulo WASM
    const dilithiumModule = await import('dilithium-crystals');
    
    // Acceder a la API correcta de dilithium-crystals
    const dilithium = dilithiumModule.dilithium;
    
    // dilithium-crystals usa verifyDetached para verificar firmas separadas
    if (typeof dilithium.verifyDetached !== 'function') {
      throw new Error("La función verifyDetached no está disponible en dilithium-crystals");
    }
    
    console.log(`🔍 Verificando firma de ${signature.length} bytes para mensaje de ${message.length} bytes`);
    
    // Realizar la verificación con verifyDetached
    const isValid = await dilithium.verifyDetached(signature, message, publicKey);
    
    console.log(`${isValid ? '✅' : '❌'} Verificación de firma: ${isValid ? 'VÁLIDA' : 'INVÁLIDA'}`);
    return Boolean(isValid);
    
  } catch (error) {
    console.error('❌ Error en verificación Dilithium2:', error);
    // En caso de error, consideramos la firma como inválida
    return false;
  }
}

/**
 * Prueba de auto-verificación: genera firma y la verifica inmediatamente
 * Útil para testing y debug
 */
export async function selfTest(message: string, secretKey: Uint8Array, publicKey: Uint8Array): Promise<{
  success: boolean;
  signature?: Uint8Array;
  error?: string;
}> {
  try {
    const messageBytes = new TextEncoder().encode(message);
    
    // Firmar
    const signature = await dilithiumSign(messageBytes, secretKey);
    
    // Verificar
    const isValid = await dilithiumVerify(messageBytes, signature, publicKey);
    
    if (!isValid) {
      return {
        success: false,
        error: "La firma generada no pasó la verificación"
      };
    }
    
    return {
      success: true,
      signature
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene información sobre los parámetros de firma Dilithium2
 */
export function getSignatureInfo() {
  return {
    algorithm: "CRYSTALS-Dilithium2 (ML-DSA-44)",
    signatureSize: "~2420 bytes (variable)",
    securityLevel: "NIST Level 2",
    quantumSafe: true,
    deterministic: false, // Las firmas incluyen aleatoriedad
    notes: "Tamaño de firma puede variar ligeramente según el mensaje"
  };
}