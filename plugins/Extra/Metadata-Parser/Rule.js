// Add here any exception for path that will not use the general one. Instead of using only {} fields use any Words:{field} (case sensitive) to declare an exception
//
// Example:
//
// The exception rule must be declared from the start of the path
// 'XXX:{group}/{studio}' is valid
// 'XXX:{group}/Hotty:{performer}/{group}' is valid
// 'XXX:{group}/{studio}/Hotty:{performer} is not vaild
//
// General path: '{studio}/{group}/{performer}'
// Exception: 'XXX:{group}/{performer}/{group}
// If the path includes XXX/ then will use the exception
//
// After each entry add a comma except for the last one.

const pathException = [
    '',
    '',
    ''
];

//DON'T CHANGE ME
sessionStorage.setItem('skExtra - Metadata-Parser', JSON.stringify({ pathException: pathException }));