'use strict';

module.exports = {
  access: (vendor, email) => {
    return `<script type="text/javascript">window.opener.postMessage({ email: "${ email }", vendor: "${ vendor }",code: 200 }, "*"); window.close();</script>`;
  },
  fail: (err, vendor) => {
    return `<script type="text/javascript">window.opener.postMessage({ vendor: "${ vendor }", code: ${ err.status || 400 }, message: '${ err.message }'}, "*");window.close();</script>`;
  }
};
