import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createLeadAction } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AddLeadPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Lead</h1>
          <p className="text-sm text-muted-foreground">Manually enter a new lead into the system.</p>
        </div>
      </div>

      <form action={createLeadAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary details for the person</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input id="jobTitle" name="jobTitle" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="contactLinkedinUrl">LinkedIn Profile URL</Label>
              <Input id="contactLinkedinUrl" name="contactLinkedinUrl" type="url" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>The organization they represent</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" name="companyName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" name="industry" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain (e.g. example.com)</Label>
              <Input id="domain" name="domain" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Requirements</CardTitle>
            <CardDescription>What they need and context</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="originalRequirement">Original Requirement / Notes</Label>
              <Textarea id="originalRequirement" name="originalRequirement" rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceRequired">Service Required</Label>
              <Input id="serviceRequired" name="serviceRequired" placeholder="e.g. Web Development" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">Estimated Budget</Label>
              <Input id="estimatedBudget" name="estimatedBudget" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Input id="timeline" name="timeline" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="e.g. LinkedIn, Referral" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select 
                id="priority" 
                name="priority"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/leads">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit">Create Lead</Button>
        </div>
      </form>
    </div>
  );
}
