import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { errorMessage, TasksApi } from './tasks-api';

describe('TasksApi', () => {
  let api: TasksApi;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/tasks`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TasksApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts to the transition endpoint for state changes', () => {
    api.transition('abc', 'complete').subscribe();

    const request = http.expectOne(`${baseUrl}/abc/complete`);
    expect(request.request.method).toBe('POST');
    request.flush({});
  });

  it('puts the edited details to the task resource', () => {
    const body = { title: 'Edited', description: null, priority: 'High' as const, dueDate: null };

    api.update('abc', body).subscribe();

    const request = http.expectOne(`${baseUrl}/abc`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush({});
  });
});

describe('errorMessage', () => {
  it('uses the problem detail sent by the API', () => {
    const error = new HttpErrorResponse({ status: 400, error: { detail: 'Title is required.' } });

    expect(errorMessage(error)).toBe('Title is required.');
  });

  it('explains when the API cannot be reached', () => {
    const error = new HttpErrorResponse({ status: 0 });

    expect(errorMessage(error)).toContain('not reachable');
  });
});
