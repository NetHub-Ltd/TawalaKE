import { PlatformJobsPage } from "@/features/platform/components/PlatformJobsPage";

export const metadata = {
  title: "Background jobs | Platform",
  description: "Celery workers, queues, and task replay",
};

export default function Page() {
  return <PlatformJobsPage />;
}
