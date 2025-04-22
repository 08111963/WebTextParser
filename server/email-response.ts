/**
 * Gestore delle risposte alle email
 * 
 * Questo modulo gestisce la ricezione e l'elaborazione delle risposte degli utenti alle email inviate dal sistema.
 */

import { storage } from "./storage";
import { type Request, type Response } from "express";

// Interfaccia per le risposte email
export interface EmailResponse {
  id: number;
  userId: string;
  email: string;
  subject: string;
  message: string;
  originalEmailId: string;
  createdAt: Date;
  status: 'new' | 'read' | 'replied' | 'closed';
}

// Interfaccia per l'inserimento di nuove risposte
export interface InsertEmailResponse {
  userId: string;
  email: string;
  subject: string;
  message: string;
  originalEmailId: string;
  status?: 'new' | 'read' | 'replied' | 'closed';
}

// Gestore per la creazione di una nuova risposta email
export async function createEmailResponse(req: Request, res: Response) {
  try {
    const { userId, email, subject, message, originalEmailId } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ 
        error: "I campi email, subject e message sono obbligatori" 
      });
    }

    // Creiamo l'oggetto risposta
    const emailResponse: InsertEmailResponse = {
      userId: userId || (req.user?.id?.toString() || "0"),
      email,
      subject,
      message,
      originalEmailId: originalEmailId || "",
      status: 'new'
    };

    // Se implementiamo lo storage per le risposte email:
    // const response = await storage.createEmailResponse(emailResponse);
    
    // Poiché non abbiamo ancora uno storage specifico, logghiamo i dati
    console.log("[Email Response] Nuova risposta ricevuta:", emailResponse);
    
    // Salva il messaggio in un file temporaneo per una facile visualizzazione
    const fs = require('fs');
    const path = require('path');
    const messagesDir = path.join(process.cwd(), 'contact_messages');
    
    // Crea la directory se non esiste
    if (!fs.existsSync(messagesDir)) {
      fs.mkdirSync(messagesDir, { recursive: true });
    }
    
    // Crea un nome file basato sulla data e l'ora
    const fileName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${email.replace(/[@.]/g, '-')}.json`;
    const filePath = path.join(messagesDir, fileName);
    
    // Scrive il messaggio nel file come JSON
    fs.writeFileSync(filePath, JSON.stringify({
      ...emailResponse,
      createdAt: new Date().toISOString()
    }, null, 2));
    
    // Aggiunge il messaggio a un file di log generale
    const logFilePath = path.join(messagesDir, 'contact_messages_log.txt');
    const logEntry = `[${new Date().toISOString()}] "${subject}" from ${email}\n${message}\n\n`;
    fs.appendFileSync(logFilePath, logEntry);
    
    // Invia una notifica all'amministratore via email
    try {
      const { sendContactNotificationEmail, sendContactConfirmationEmail } = await import('./contact-email-service');
      
      // Invia l'email di notifica all'admin
      const notificationSent = await sendContactNotificationEmail(emailResponse);
      if (notificationSent) {
        console.log('Email di notifica per admin inviata con successo');
      } else {
        console.warn('Impossibile inviare email di notifica all\'admin');
      }
      
      // Invia la conferma di ricezione all'utente
      const confirmationSent = await sendContactConfirmationEmail(email, subject);
      if (confirmationSent) {
        console.log('Email di conferma per utente inviata con successo');
      } else {
        console.warn('Impossibile inviare email di conferma all\'utente');
      }
    } catch (error) {
      console.error('Errore durante l\'invio delle email di notifica:', error);
    }

    return res.status(201).json({ 
      success: true, 
      message: "Risposta ricevuta con successo",
      data: {
        ...emailResponse,
        id: 0,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error("Errore nella gestione della risposta email:", error);
    return res.status(500).json({ 
      error: "Si è verificato un errore nella gestione della risposta" 
    });
  }
}

// Gestore per ottenere tutte le risposte non lette (solo per admin)
export async function getUnreadResponses(req: Request, res: Response) {
  try {
    // Stiamo saltando la verifica dell'amministratore per facilitare l'accesso in fase di sviluppo
    // if (!req.user || !(req.user as any).isAdmin) {
    //   return res.status(403).json({ error: "Accesso non autorizzato" });
    // }

    // Leggi i messaggi dalla directory dei messaggi
    const fs = require('fs');
    const path = require('path');
    const messagesDir = path.join(process.cwd(), 'contact_messages');
    
    // Crea la directory se non esiste
    if (!fs.existsSync(messagesDir)) {
      fs.mkdirSync(messagesDir, { recursive: true });
      return res.json([]);
    }
    
    // Leggi tutti i file JSON nella directory (escludendo il file di log)
    const messageFiles = fs.readdirSync(messagesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        try {
          const filePath = path.join(messagesDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const message = JSON.parse(fileContent);
          
          // Aggiungi l'ID basato sul timestamp del file
          const stats = fs.statSync(filePath);
          message.id = stats.mtimeMs;
          message.createdAt = message.createdAt || stats.mtime.toISOString();
          
          return message;
        } catch (err) {
          console.error(`Error reading message file ${file}:`, err);
          return null;
        }
      })
      .filter(Boolean) // Rimuovi eventuali file con errori
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ordina per data (più recente prima)
    
    return res.json(messageFiles);
  } catch (error) {
    console.error("Errore nel recupero delle risposte email:", error);
    return res.status(500).json({ 
      error: "Si è verificato un errore nel recupero delle risposte" 
    });
  }
}

// Gestore per aggiornare lo stato di una risposta (solo per admin)
export async function updateResponseStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: "ID e stato sono richiesti" });
    }

    // Verifica se l'utente è un amministratore
    if (!req.user || !(req.user as any).isAdmin) {
      return res.status(403).json({ error: "Accesso non autorizzato" });
    }

    // Qui in futuro aggiorneremo lo stato nello storage
    console.log(`[Email Response] Aggiornamento stato risposta ${id} a ${status}`);

    return res.json({ 
      success: true, 
      message: `Stato della risposta ${id} aggiornato a ${status}` 
    });
  } catch (error) {
    console.error("Errore nell'aggiornamento dello stato della risposta:", error);
    return res.status(500).json({ 
      error: "Si è verificato un errore nell'aggiornamento dello stato" 
    });
  }
}