import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl py-10 mx-auto">
      <div className="mb-8">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Introduction</h2>
          <p>
            At NutriEasy, we respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you 
            use our website and services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Information We Collect</h2>
          <p>We collect several types of information from and about users of our platform, including:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Personal information (such as name, email address, and login credentials) that you provide when creating an account or using our services.</li>
            <li>Health and fitness information that you choose to share, including weight, height, age, gender, activity level, nutritional goals, meals logged, and progress data.</li>
            <li>Usage data about how you interact with our platform, including pages visited, features used, and time spent on the platform.</li>
            <li>Device information including IP address, browser type, and operating system.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide, maintain, and improve our platform and services.</li>
            <li>Personalize your experience by delivering relevant content and recommendations based on your nutrition goals and preferences.</li>
            <li>Process your transactions and manage your account.</li>
            <li>Communicate with you about updates, new features, or support issues.</li>
            <li>Monitor usage patterns and analyze trends to enhance user experience.</li>
            <li>Protect the security and integrity of our platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information 
            from unauthorized access, disclosure, alteration, or destruction. However, please note that no method 
            of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Data Sharing and Disclosure</h2>
          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and hosting services.</li>
            <li>Business partners with your consent, for specific promotional or collaborative purposes.</li>
            <li>Legal authorities when required by law or to protect our rights, safety, or property.</li>
          </ul>
          <p className="mt-2">
            We do not sell or rent your personal information to third parties for their marketing purposes without your explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Your Rights</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>The right to access and obtain a copy of your personal information.</li>
            <li>The right to rectify inaccurate or incomplete personal information.</li>
            <li>The right to request deletion of your personal information in certain circumstances.</li>
            <li>The right to restrict or object to processing of your personal information.</li>
            <li>The right to data portability, allowing you to obtain and reuse your personal information.</li>
            <li>The right to withdraw consent at any time, where processing is based on your consent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our platform and store certain information. 
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not 
            accept cookies, you may not be able to use some portions of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Children's Privacy</h2>
          <p>
            Our platform is not intended for children under the age of 16, and we do not knowingly collect personal information 
            from children under 16. If we learn we have collected personal information from a child under 16 without parental consent, 
            we will delete that information as quickly as possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this page 
            and notify you through the platform or via email. We encourage you to review this Privacy Policy frequently to stay informed about 
            how we are protecting your information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            privacy@nutrieasy.com
          </p>
        </section>

        <div className="border-t pt-4 mt-6">
          <p className="text-sm">Last Updated: April 20, 2025</p>
        </div>
      </div>
    </div>
  );
}