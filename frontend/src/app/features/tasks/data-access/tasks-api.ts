import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PagedResult,
  ProblemDetails,
  Task,
  TaskListQuery,
  TaskRequest,
  TaskSummary,
} from './task.model';

export type TaskTransition = 'start' | 'complete' | 'reopen';

@Service()
export class TasksApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  search(query: TaskListQuery): Observable<PagedResult<Task>> {
    let params = new HttpParams()
      .set('view', query.view)
      .set('sortBy', query.sortBy)
      .set('direction', query.direction)
      .set('page', query.page);

    const search = query.search.trim();
    if (search) params = params.set('search', search);

    return this.http.get<PagedResult<Task>>(this.baseUrl, { params });
  }

  summary(): Observable<TaskSummary> {
    return this.http.get<TaskSummary>(`${this.baseUrl}/summary`);
  }

  getById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${id}`);
  }

  create(request: TaskRequest): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, request);
  }

  update(id: string, request: TaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${id}`, request);
  }

  transition(id: string, transition: TaskTransition): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/${id}/${transition}`, null);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

/** Extracts the human-readable message from an API error, falling back to a generic one. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const problem = error.error as ProblemDetails | null;
    if (problem?.detail) return problem.detail;
    if (error.status === 0) return 'The server is not reachable. Is the API running?';
  }
  return 'Something went wrong. Please try again.';
}
