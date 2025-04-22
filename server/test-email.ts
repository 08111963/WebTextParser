/**
 * Test del servizio email
 * 
 * Questo script consente di testare l'invio di email con Brevo
 */

import { sendWelcomeEmail } from './email-service';

// Email di test
const TEST_EMAIL = "noreply.nutrieasy@gmail.com";
const TEST_USERNAME = "Utente Test";

async function testEmailService() {
  console.log("=== Test del servizio email ===");
  console.log(`Invio email di benvenuto a ${TEST_EMAIL}...`);
  
  try {
    const result = await sendWelcomeEmail(TEST_EMAIL, TEST_USERNAME);
    
    if (result) {
      console.log("✅ Email inviata con successo!");
    } else {
      console.log("❌ Invio dell'email fallito.");
    }
  } catch (error) {
    console.error("❌ Errore durante l'invio dell'email:", error);
  }
  
  console.log("=== Fine del test ===");
}

// Esegui il test
testEmailService().catch(console.error);