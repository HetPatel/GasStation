import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
 transform(value: any[], args): any {
        if (!args[0])
            return value;
        else if (value) {
            return value.filter(item => {
                for (let key in item) {
                    if ((typeof item[key] === 'string' || item[key] instanceof String) &&
                        (item[key].toLowerCase().indexOf(args.toLowerCase()) !== -1)){
                        return true;
                    }
                }
            });
        }
    }
}
