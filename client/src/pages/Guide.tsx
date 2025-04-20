import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Guide() {
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <Link href="/pricing">
          <Button className="flex items-center">
            Get Started
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          NutriEasy User Guide
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your complete guide to nutrition tracking and healthy eating
        </p>

        <div className="space-y-10">
          {/* Introduction */}
          <section>
            <h2 className="text-3xl font-bold mb-4">Welcome to NutriEasy</h2>
            <p className="mb-4">
              NutriEasy is a comprehensive nutrition and wellness platform designed to help you track your meals, 
              set nutritional goals, and improve your overall health through personalized recommendations and 
              AI-powered meal suggestions.
            </p>
            <p className="mb-4">
              Whether you're trying to lose weight, build muscle, or simply maintain a healthier lifestyle, 
              NutriEasy provides the tools and insights you need to succeed on your wellness journey.
            </p>
          </section>

          {/* Key Features */}
          <section>
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meal Tracking</CardTitle>
                  <CardDescription>Record and monitor your daily food intake</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Easily log your meals with detailed nutritional information including calories, 
                    proteins, carbs, and fats. View your history to identify patterns and make 
                    informed choices about your diet.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Nutritional Goals</CardTitle>
                  <CardDescription>Set and track personalized targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Create customized nutritional goals based on your specific needs and preferences.
                    Track your progress with visual charts and receive recommendations to help you 
                    stay on target.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Recommendations</CardTitle>
                  <CardDescription>Get personalized meal suggestions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Our advanced AI analyzes your profile, preferences, and goals to provide 
                    tailored meal recommendations and nutritional advice. Discover new meal 
                    ideas that align with your dietary needs.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Health Calculators</CardTitle>
                  <CardDescription>Monitor key health metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Access integrated tools to calculate important health indicators like BMI 
                    (Body Mass Index) and metabolism rate. These insights help you better 
                    understand your body's needs and adjust your nutrition accordingly.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progress Tracking</CardTitle>
                  <CardDescription>Monitor your journey over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Record and visualize your progress with comprehensive tracking tools.
                    Log measurements, weight changes, and other metrics to see how your 
                    nutrition choices impact your overall health.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Export</CardTitle>
                  <CardDescription>Take your data with you</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Export all your nutritional data, meal history, and progress information
                    at any time. Your data belongs to you, and we make it easy to download it
                    in a convenient format.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Trial Period Information */}
          <section className="bg-primary/5 p-6 rounded-lg border">
            <h2 className="text-3xl font-bold mb-4">Free Trial Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">5-Day Free Trial</h3>
                <p>
                  All new users receive a complimentary 5-day trial period with full access to all premium features.
                  This allows you to explore everything NutriEasy has to offer before deciding on a subscription plan.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Trial Features</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Full access to all meal tracking and nutritional goal features</li>
                  <li>Unlimited AI-powered meal recommendations</li>
                  <li>Complete health calculator suite (BMI, metabolism)</li>
                  <li>Progress tracking and visualization tools</li>
                  <li>Data export functionality</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Trial Expiration</h3>
                <p className="mb-2">
                  You'll receive notifications when your trial period is nearing its end (2 days before expiration)
                  and when it officially expires. These notifications will appear in the app to ensure you're informed
                  about your trial status.
                </p>
                <p>
                  After your trial expires, you'll enter a 7-day grace period during which your data will be retained.
                  During this time, you can choose to subscribe to continue using all features without losing any of your data.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Data Retention</h3>
                <p>
                  Your data is important to us. Even if you decide not to subscribe after your trial ends,
                  we provide a data export feature so you can download and keep all your nutritional information,
                  meal history, and progress data. We recommend exporting your data before your grace period expires.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">One Trial Per User</h3>
                <p>
                  To ensure fairness for all users, our system allows only one free trial per person.
                  Multiple registrations using the same email address or from the same device within a 30-day period
                  will be identified as duplicate registrations and will not qualify for additional trial periods.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Subscription Options</h3>
                <p className="mb-2">
                  After your trial period, you can choose from two subscription options:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Monthly Plan: $3.99/month for continued access to all features</li>
                  <li>Annual Plan: $39.99/year (saving over 16% compared to the monthly plan)</li>
                </ul>
                <p className="mt-2">
                  Both subscription options provide full access to all NutriEasy features and future updates.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/pricing">
                <Button size="lg" className="px-8">
                  View Subscription Plans
                </Button>
              </Link>
            </div>
          </section>

          {/* Getting Started */}
          <section>
            <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Step 1: Create Your Account</h3>
                <p>
                  Register with your email address and choose a secure password. Your free trial
                  will begin immediately after registration.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Step 2: Complete Your Profile</h3>
                <p>
                  Fill in your personal details including age, weight, height, gender, and activity level.
                  This information helps us provide accurate nutritional recommendations and calculations.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Step 3: Set Your Nutritional Goals</h3>
                <p>
                  Define your nutritional targets or use our AI-powered recommendation engine to
                  suggest appropriate goals based on your profile and objectives.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Step 4: Start Tracking Your Meals</h3>
                <p>
                  Begin logging your meals and monitoring your nutritional intake. Use our AI meal suggestions
                  to discover new food options that align with your goals.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Step 5: Monitor Your Progress</h3>
                <p>
                  Track your progress over time and make adjustments to your nutritional goals as needed.
                  Our visualizations help you understand trends and patterns in your eating habits.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/auth">
                <Button size="lg" className="px-8">
                  Create Account
                </Button>
              </Link>
            </div>
          </section>
          
          {/* Customer Support */}
          <section>
            <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
            <p className="mb-4">
              Our customer support team is here to assist you with any questions or issues you may encounter.
              We're committed to ensuring you have the best possible experience with NutriEasy.
            </p>
            <p>
              Contact us at <span className="font-semibold">support@nutrieasy.com</span> or visit our help center
              for additional resources and guidance.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}