import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Palette, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@shared/schema";

interface CalendarItem {
  id: string;
  type: "deadline" | "task" | "timeline";
  title: string;
  date: string;
  meta: Record<string, any>;
}

interface CalendarResponse {
  month: string;
  items: CalendarItem[];
}

interface CaseMonthCalendarProps {
  caseId: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CaseMonthCalendar({ caseId }: CaseMonthCalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  
  const [colorForm, setColorForm] = useState({
    taskColor: "#2E7D32",
    deadlineColor: "#C62828",
    timelineColor: "#1565C0",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const { data: profileData } = useQuery<{ profile: UserProfile }>({
    queryKey: ["/api/profile"],
  });

  const profile = profileData?.profile;
  const taskColor = profile?.calendarTaskColor || "#2E7D32";
  const deadlineColor = profile?.calendarDeadlineColor || "#C62828";
  const timelineColor = profile?.calendarTimelineColor || "#1565C0";

  const { data: calendarData, isLoading } = useQuery<CalendarResponse>({
    queryKey: ["/api/cases", caseId, "calendar", monthStr],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/calendar?month=${monthStr}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch calendar");
      return res.json();
    },
    enabled: !!caseId,
  });

  const updateColorsMutation = useMutation({
    mutationFn: async (colors: typeof colorForm) => {
      return apiRequest("PATCH", "/api/profile", {
        calendarTaskColor: colors.taskColor,
        calendarDeadlineColor: colors.deadlineColor,
        calendarTimelineColor: colors.timelineColor,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Calendar colors updated" });
      setColorDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update colors", variant: "destructive" });
    },
  });

  const openColorDialog = () => {
    setColorForm({
      taskColor: taskColor,
      deadlineColor: deadlineColor,
      timelineColor: timelineColor,
    });
    setColorDialogOpen(true);
  };

  const handleSaveColors = () => {
    updateColorsMutation.mutate(colorForm);
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getItemColor = (type: CalendarItem["type"]) => {
    switch (type) {
      case "task":
        return taskColor;
      case "deadline":
        return deadlineColor;
      case "timeline":
        return timelineColor;
      default:
        return "#888888";
    }
  };

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  while (currentWeek.length < 7 && currentWeek.length > 0) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getItemsForDay = (day: number): CalendarItem[] => {
    if (!calendarData?.items) return [];
    
    return calendarData.items.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getDate() === day;
    });
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const getTypeRoute = (item: CalendarItem) => {
    switch (item.type) {
      case "task":
        return `/app/tasks/${caseId}`;
      case "deadline":
        return `/app/deadlines/${caseId}`;
      case "timeline":
        return `/app/timeline/${caseId}`;
      default:
        return `/app/case/${caseId}`;
    }
  };

  const getTypeLabel = (type: CalendarItem["type"]) => {
    switch (type) {
      case "task":
        return "Task";
      case "deadline":
        return "Deadline";
      case "timeline":
        return "Timeline Event";
      default:
        return "Item";
    }
  };

  return (
    <Card className="bg-white border-0 shadow-none h-full" data-testid="calendar-month">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={goToPrevMonth}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-heading font-bold text-lg text-neutral-darkest min-w-[160px] text-center">
            {formatMonthYear()}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={goToNextMonth}
            data-testid="button-next-month"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            data-testid="button-today"
          >
            Today
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={openColorDialog}
            data-testid="button-calendar-colors"
          >
            <Palette className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="font-sans text-sm text-neutral-darkest/60">Loading calendar...</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-[#f4f6f5]">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center font-sans text-xs font-medium text-neutral-darkest/70 border-b"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {weeks.map((week, weekIdx) =>
                week.map((day, dayIdx) => {
                  const items = day ? getItemsForDay(day) : [];
                  const displayItems = items.slice(0, 3);
                  const moreCount = items.length - 3;

                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className={[
                        "min-h-[80px] border-b border-r p-1",
                        day ? "bg-white" : "bg-neutral-50",
                        dayIdx === 6 ? "border-r-0" : "",
                        weekIdx === weeks.length - 1 ? "border-b-0" : "",
                      ].join(" ")}
                    >
                      {day && (
                        <>
                          <div
                            className={[
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1",
                              isToday(day)
                                ? "bg-primary text-primary-foreground"
                                : "text-neutral-darkest",
                            ].join(" ")}
                          >
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {displayItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="w-full text-left px-1.5 py-0.5 rounded text-xs font-sans text-white truncate"
                                style={{ backgroundColor: getItemColor(item.type) }}
                                data-testid={`calendar-item-${item.id}`}
                              >
                                {item.title}
                              </button>
                            ))}
                            {moreCount > 0 && (
                              <p className="text-xs text-neutral-darkest/60 px-1">
                                +{moreCount} more
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Calendar Colors</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="color-task">Tasks Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="color-task"
                  type="color"
                  value={colorForm.taskColor}
                  onChange={(e) =>
                    setColorForm({ ...colorForm, taskColor: e.target.value })
                  }
                  className="w-10 h-10 rounded border cursor-pointer"
                  data-testid="input-color-task"
                />
                <span className="font-mono text-sm text-neutral-darkest/70">
                  {colorForm.taskColor}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color-deadline">Deadlines Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="color-deadline"
                  type="color"
                  value={colorForm.deadlineColor}
                  onChange={(e) =>
                    setColorForm({ ...colorForm, deadlineColor: e.target.value })
                  }
                  className="w-10 h-10 rounded border cursor-pointer"
                  data-testid="input-color-deadline"
                />
                <span className="font-mono text-sm text-neutral-darkest/70">
                  {colorForm.deadlineColor}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color-timeline">Timeline Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="color-timeline"
                  type="color"
                  value={colorForm.timelineColor}
                  onChange={(e) =>
                    setColorForm({ ...colorForm, timelineColor: e.target.value })
                  }
                  className="w-10 h-10 rounded border cursor-pointer"
                  data-testid="input-color-timeline"
                />
                <span className="font-mono text-sm text-neutral-darkest/70">
                  {colorForm.timelineColor}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setColorDialogOpen(false)}
              data-testid="button-cancel-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveColors}
              disabled={updateColorsMutation.isPending}
              className="bg-primary text-primary-foreground"
              data-testid="button-save-colors"
            >
              {updateColorsMutation.isPending ? "Saving..." : "Save Colors"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base">{selectedItem?.title}</DialogTitle>
            </div>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getItemColor(selectedItem.type) }}
                />
                <span className="font-sans text-sm text-neutral-darkest/70">
                  {getTypeLabel(selectedItem.type)}
                </span>
              </div>
              <p className="font-sans text-sm text-neutral-darkest">
                {new Date(selectedItem.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {selectedItem.meta?.priority && (
                <p className="font-sans text-sm text-neutral-darkest/70">
                  Priority: {selectedItem.meta.priority === 1 ? "High" : selectedItem.meta.priority === 2 ? "Medium" : "Low"}
                </p>
              )}
              {selectedItem.meta?.category && (
                <p className="font-sans text-sm text-neutral-darkest/70">
                  Category: {selectedItem.meta.category}
                </p>
              )}
              {selectedItem.meta?.status && (
                <p className="font-sans text-sm text-neutral-darkest/70">
                  Status: {selectedItem.meta.status}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
              data-testid="button-close-item-detail"
            >
              Close
            </Button>
            {selectedItem && (
              <a href={getTypeRoute(selectedItem)}>
                <Button className="bg-primary text-primary-foreground" data-testid="button-open-item-page">
                  Open in {getTypeLabel(selectedItem.type)}s
                </Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
