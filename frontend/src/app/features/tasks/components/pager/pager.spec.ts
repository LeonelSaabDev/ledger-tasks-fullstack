import { TestBed } from '@angular/core/testing';
import { Pager } from './pager';

describe('Pager', () => {
  async function render(page: number, totalPages: number) {
    const fixture = TestBed.createComponent(Pager);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('totalPages', totalPages);
    await fixture.whenStable();
    return fixture;
  }

  it('hides itself when everything fits on one page', async () => {
    const fixture = await render(1, 1);

    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });

  it('disables Previous on the first page and emits the next page', async () => {
    const fixture = await render(1, 3);
    let emitted: number | undefined;
    fixture.componentInstance.pageChange.subscribe((page) => (emitted = page));
    const [previous, next] = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

    next.click();

    expect(previous.disabled).toBe(true);
    expect(emitted).toBe(2);
  });
});
