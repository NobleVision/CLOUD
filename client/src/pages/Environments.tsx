import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Server, Activity, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const environmentColors = {
  prod: 'bg-primary text-primary-foreground',
  staging: 'bg-chart-3 text-white',
  dev: 'bg-chart-4 text-white',
};

export default function Environments() {
  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  const groupedProjects = projects?.reduce((acc, project) => {
    if (!acc[project.environment]) {
      acc[project.environment] = [];
    }
    acc[project.environment].push(project);
    return acc;
  }, {} as Record<string, typeof projects>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Environments</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor GCP projects across all environments
          </p>
        </div>

        {/* Environment Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          {(['prod', 'staging', 'dev'] as const).map(env => {
            const count = projects?.filter(p => p.environment === env).length || 0;
            
            return (
              <Card key={env}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium capitalize">{env}</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {count === 1 ? 'project' : 'projects'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Projects by Environment */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map(j => (
                      <Skeleton key={j} className="h-32" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groupedProjects ? (
          <div className="space-y-6">
            {(['prod', 'staging', 'dev'] as const).map(env => {
              const envProjects = groupedProjects[env] || [];
              
              if (envProjects.length === 0) return null;
              
              return (
                <Card key={env}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Badge className={environmentColors[env]}>
                        {env.toUpperCase()}
                      </Badge>
                      <CardTitle className="capitalize">{env} Environment</CardTitle>
                    </div>
                    <CardDescription>
                      {envProjects.length} {envProjects.length === 1 ? 'project' : 'projects'} in this environment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {envProjects.map(project => (
                        <div
                          key={project.id}
                          className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg mb-1 truncate">
                                {project.projectName}
                              </h3>
                              <p className="text-sm text-muted-foreground font-mono">
                                {project.projectId}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-2 h-2 rounded-full bg-chart-2" title="Healthy" />
                              <Activity className="h-4 w-4 text-chart-2" />
                            </div>
                          </div>
                          
                          {project.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {project.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              <span>Active</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>0 alerts</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No projects found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
