import React from "react";
import { EmailResponseForm } from "@/components/EmailResponseForm";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contatti() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-semibold mb-6">We're Here to Help</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Do you have questions about NutriEasy, suggestions to improve our service, or need assistance?
            Contact us using the form or one of the contact methods listed below.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <Mail className="h-6 w-6 text-primary mr-3" />
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-gray-600 dark:text-gray-400">support@nutrieasy.eu</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Phone className="h-6 w-6 text-primary mr-3" />
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-gray-600 dark:text-gray-400">+39 123 456 7890</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-6 w-6 text-primary mr-3" />
              <div>
                <h3 className="font-medium">Headquarters</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Via Roma 123<br />
                  00100 Rome, Italy
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-medium mb-4">Support Hours</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-gray-600 dark:text-gray-400">Monday - Friday:</div>
              <div>9:00 AM - 6:00 PM</div>
              
              <div className="text-gray-600 dark:text-gray-400">Saturday:</div>
              <div>10:00 AM - 2:00 PM</div>
              
              <div className="text-gray-600 dark:text-gray-400">Sunday:</div>
              <div>Closed</div>
            </div>
          </div>
        </div>
        
        <div>
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="p-6">
                <EmailResponseForm />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="rounded-lg overflow-hidden h-[400px] mt-12">
        <iframe
          title="NutriEasy Location"
          className="w-full h-full"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2969.6974673276663!2d12.493312876536468!3d41.90248676608031!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132f61a8a6963cb1%3A0xb3e01178708ffc48!2sVia%20Roma%2C%20Roma%2C%20Italy!5e0!3m2!1sen!2sus!4v1712923782414!5m2!1sen!2sus"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}