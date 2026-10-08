import { prisma } from "@/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPortfolioItemAction, togglePortfolioItemAction } from "./actions";
import { Badge } from "@/components/ui/badge";

export default async function PortfolioPage() {
  const session = await auth();
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  const items = await prisma.portfolioItem.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Library</h1>
        <p className="text-sm text-muted-foreground">Manage case studies, portfolio items, and proof points.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Portfolio Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPortfolioItemAction} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input name="title" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input name="industry" />
              </div>
              <div className="space-y-2">
                <Label>Services (comma separated)</Label>
                <Input name="services" placeholder="Web Development, SEO" />
              </div>
              <div className="space-y-2">
                <Label>Technologies (comma separated)</Label>
                <Input name="technologies" placeholder="React, Node.js" />
              </div>
              <div className="space-y-2">
                <Label>Positioning Compatibility (comma separated)</Label>
                <Input name="positioningCompatibility" placeholder="AGENCY, FREELANCER" />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input name="url" type="url" />
              </div>
              <Button type="submit">Create Item</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Existing Items</h2>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No portfolio items found.</p>
          ) : (
            items.map(item => (
              <Card key={item.id}>
                <CardContent className="pt-6 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Active" : "Archived"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    <strong>Services:</strong> {item.services.join(", ")} <br/>
                    <strong>Industry:</strong> {item.industry}
                  </div>
                  <form action={togglePortfolioItemAction.bind(null, item.id, item.isActive)}>
                    <Button variant="outline" size="sm" type="submit" className="mt-2">
                      {item.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
