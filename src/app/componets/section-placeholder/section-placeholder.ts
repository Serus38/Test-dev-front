import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-section-placeholder',
  template: `
    <section class="placeholder">
      <h1>{{ title }}</h1>
      <p>Vista base de {{ title.toLowerCase() }}. Puedes reemplazarla por tu componente real cuando quieras.</p>
    </section>
  `,
  styles: `
    .placeholder {
      background: #ffffff;
      border: 1px solid #d9e2ef;
      border-radius: 14px;
      padding: 20px;
    }

    h1 {
      margin: 0 0 8px;
      color: #16334f;
      font-size: 1.4rem;
    }

    p {
      margin: 0;
      color: #304558;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionPlaceholder {
  private readonly route = inject(ActivatedRoute);

  get title(): string {
    return (this.route.snapshot.data['title'] as string) ?? 'Seccion';
  }
}
