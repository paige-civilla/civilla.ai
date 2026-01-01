import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, CreditCard, Settings } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  partyRole: string | null;
  isSelfRepresented: boolean;
  autoFillEnabled: boolean;
  firmName: string | null;
  barNumber: string | null;
}

export default function AppAccountSettings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
  });

  const { data: profileData, isLoading } = useQuery<{ profile: UserProfile }>({
    queryKey: ["/api/profile"],
  });

  useEffect(() => {
    if (profileData?.profile) {
      setFormData({
        fullName: profileData.profile.fullName || "",
        email: profileData.profile.email || "",
        phone: profileData.profile.phone || "",
        addressLine1: profileData.profile.addressLine1 || "",
        addressLine2: profileData.profile.addressLine2 || "",
        city: profileData.profile.city || "",
        state: profileData.profile.state || "",
        zip: profileData.profile.zip || "",
      });
    }
  }, [profileData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8">
        <div className="rounded-2xl bg-[#e7ebea] p-6 md:p-8 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-bush text-white flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-darkest">
                Account Settings
              </h1>
              <p className="font-sans text-neutral-darkest/70 mt-1">
                Manage your profile and subscription.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-heading font-bold text-neutral-darkest">
                <div className="w-10 h-10 rounded-lg bg-[#f4f6f5] flex items-center justify-center">
                  <User className="w-5 h-5 text-bush" />
                </div>
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-neutral-darkest">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Your full name"
                      className="mt-1"
                      data-testid="input-fullname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-neutral-darkest">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="mt-1"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-neutral-darkest">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="mt-1"
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="font-sans font-medium text-neutral-darkest mb-4">Address</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine1" className="text-neutral-darkest">Street Address</Label>
                      <Input
                        id="addressLine1"
                        value={formData.addressLine1}
                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                        placeholder="123 Main St"
                        className="mt-1"
                        data-testid="input-address1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine2" className="text-neutral-darkest">Apt, Suite, etc. (optional)</Label>
                      <Input
                        id="addressLine2"
                        value={formData.addressLine2}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                        placeholder="Apt 4B"
                        className="mt-1"
                        data-testid="input-address2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-neutral-darkest">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="mt-1"
                        data-testid="input-city"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state" className="text-neutral-darkest">State</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="State"
                          className="mt-1"
                          data-testid="input-state"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip" className="text-neutral-darkest">ZIP</Label>
                        <Input
                          id="zip"
                          value={formData.zip}
                          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                          placeholder="12345"
                          className="mt-1"
                          data-testid="input-zip"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-bush text-white"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-heading font-bold text-neutral-darkest">
                <div className="w-10 h-10 rounded-lg bg-[#f4f6f5] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-bush" />
                </div>
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#f4f6f5] rounded-lg p-6 text-center">
                <p className="font-sans text-neutral-darkest mb-2">Manage your plan</p>
                <p className="font-sans text-sm text-neutral-darkest/60 mb-4">
                  Subscription management coming soon
                </p>
                <Button variant="outline" disabled data-testid="button-manage-plan">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
