import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function TermsOfService() {
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
      
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">1. Agreement to Terms</h2>
          <p>
            By accessing or using NutriEasy, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
            If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">2. Use License</h2>
          <p>
            Permission is granted to temporarily use NutriEasy for personal, non-commercial purposes. This is the grant of a license, 
            not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on NutriEasy</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
          <p className="mt-2">
            This license shall automatically terminate if you violate any of these restrictions and may be terminated by NutriEasy at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes 
            a breach of the Terms, which may result in immediate termination of your account on our service.
          </p>
          <p className="mt-2">
            You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. 
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or 
            unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">4. Subscription and Payments</h2>
          <p>
            NutriEasy offers a 5-day free trial followed by subscription options. By subscribing, you agree to pay the fees as described 
            at the time of purchase. Subscription fees are billed in advance on a monthly or yearly basis based on your selected plan.
          </p>
          <p className="mt-2">
            You can cancel your subscription at any time. Upon cancellation, your subscription will remain active until the end of the current 
            billing period. We do not provide refunds for partial subscription periods.
          </p>
          <p className="mt-2">
            We reserve the right to change our subscription plans or adjust pricing for our service in any manner and at any time as we may determine 
            in our sole discretion. Any price changes will take effect following notice to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">5. User Content</h2>
          <p>
            By submitting content to NutriEasy, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, 
            translate and distribute your content in any existing or future media. You also grant us the right to sub-license these rights and the 
            right to bring an action for infringement of these rights.
          </p>
          <p className="mt-2">
            You represent and warrant that your content is not owned by a third party and does not contain any third-party materials, 
            and is not illegal, obscene, defamatory, threatening, pornographic, harassing, hateful, racially or ethnically offensive, 
            or encourages conduct that would be considered a criminal offense, give rise to civil liability, violate any law, or is otherwise 
            inappropriate.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">6. Accuracy of Information</h2>
          <p>
            We are not responsible if information made available on this site is not accurate, complete, or current. The material on this site is provided 
            for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more 
            accurate, complete, or timely sources of information. Any reliance on the material on this site is at your own risk.
          </p>
          <p className="mt-2">
            This site may contain certain historical information. Historical information, necessarily, is not current and is provided for your reference only. 
            We reserve the right to modify the contents of this site at any time, but we have no obligation to update any information on our site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">7. Medical Disclaimer</h2>
          <p>
            The information provided by NutriEasy is for general informational purposes only. All information on the site is provided in good faith, 
            however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, 
            availability, or completeness of any information on the site.
          </p>
          <p className="mt-2">
            NutriEasy is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your 
            physician or other qualified health provider with any questions you may have regarding a medical condition or before starting any diet, 
            exercise, or supplementation program.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">8. Limitation of Liability</h2>
          <p>
            In no event shall NutriEasy, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, 
            special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
            resulting from your access to or use of or inability to access or use the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">9. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws applicable in your jurisdiction, without regard to its conflict of law provisions.
          </p>
          <p className="mt-2">
            Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held 
            to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">10. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined 
            at our sole discretion. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">11. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at: terms@nutrieasy.com
          </p>
        </section>

        <div className="border-t pt-4 mt-6">
          <p className="text-sm">Last Updated: April 20, 2025</p>
        </div>
      </div>
    </div>
  );
}