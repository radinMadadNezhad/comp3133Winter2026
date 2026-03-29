import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appInputFormat]',
  standalone: true
})
export class InputFormatDirective {

  constructor(private el: ElementRef) {}

  @HostListener('blur')
  onBlur() {
    const value = this.el.nativeElement.value;
    this.el.nativeElement.value = value.toUpperCase();
  }
}