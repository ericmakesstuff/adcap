var progressbar = VueStrap.progressbar;
var tooltip     = VueStrap.tooltip;

var Calculator = Vue.extend({
    template: '#calculator-block',
    props: ['calcid'],
    data: function () {
        return {
            goals: [1],
            nextGoalId: 2,
            startAmount: '',
            endAmount: '',
            endAmountError: false,
            startTime: false,
            endTime: false,
            calculatedAmount: false,
            perSecond: false,
            recurringID: false
        }
    },
    computed: {
        perMinute: function() {
            return this.perSecond * 60;
        },
        perHour: function () {
            return this.perMinute * 60;
        },
        perDay: function () {
            return this.perHour * 24;
        }
    },
    methods: {
        'closeCalculator': function () {
            this.$parent.removeCalculator(this.calcid)
        },
        'addGoal': function() {
            this.goals.push(this.nextGoalId);
            this.nextGoalId++;
        },
        'removeGoal': function (removeid) {
            this.goals = this.goals.filter(function (goalid) {
                return goalid != removeid;
            })
        },
        'submitStartAmount': function() {
            this.startTime = Date.now();
            this.resetCalculator();
            var self = this;
            Vue.nextTick(function () {
                self.$els.endamountinput.focus();
            });
        },
        'submitEndAmount': function() {
            this.endTime = Date.now();
            this.endAmountError = false;
            if (parseFloat(this.endAmount) > parseFloat(this.startAmount))
                this.calculatePerSecond();
            else
                this.endAmountError = true;
        },
        'resetCalculator': function () {
            this.endAmount = '';
            this.endTime = false;
            this.endAmountError = false;
            this.perSecond = false;
            this.calculatedAmount = false;
            if (this.recurringID) {
                clearInterval(this.recurringID)
                this.recurringID = false;
            }
            this.updateGoals();
        },
        'calculatePerSecond': function () {
            var difference = this.endAmount - this.startAmount;
            var elapsed = (this.endTime - this.startTime) / 1000;
            this.perSecond = (difference / elapsed);
            var self = this;
            Vue.nextTick(function () {
                self.calculateAmount();
                if (self.recurringID) {
                    clearInterval(self.recurringID)
                }
                self.recurringID = setInterval(self.calculateAmount, 500);
            });
        },
        'calculateAmount': function () {
            if (!this.perSecond || !this.endTime)
                return false;
            var elapsed = (Date.now() - this.endTime) / 1000;
            this.calculatedAmount = (parseFloat(this.endAmount) + (this.perSecond * elapsed));
            this.updateGoals();
        },
        'updateGoals': function () {
            var self = this;
            this.$children.forEach(function (child) {
                if (child.goalid)
                    child.calculateProgress(self.calculatedAmount, self.perSecond);
            });
        }
    }
});

var Goal = Vue.extend({
    template: '#goal-block',
    props: ['goalid'],
    data: function() {
        return {
            goalAmount: '',
            progress: 0,
            complete: false,
            remainingSeconds: false,
            completeDate: false
        }
    },
    methods: {
        'closeGoal': function () {
            this.$parent.removeGoal(this.goalid)
        },
        'calculateProgress': function (calculatedAmount, perSecond) {
            if (!this.goalAmount || !calculatedAmount) {
                return this.resetGoal();
            }
            var goalAmount = parseFloat(this.goalAmount);
            var progress = Math.round((calculatedAmount / goalAmount) * 100);
            this.progress = (progress > 100) ? 100 : progress;
            var remaining = goalAmount - calculatedAmount;
            var remainingSeconds = remaining / perSecond;
            if (remainingSeconds > 0) {
                this.complete = false;
                this.remainingSeconds = remainingSeconds;
                this.completeDate = Date.now() + (remainingSeconds * 1000);
            } else {
                this.complete = true;
            }
        },
        'resetGoal': function () {
            this.progress = false;
            this.remainingSeconds = false;
            this.completeDate = false;
        }
    }
});

Vue.component('calculator', Calculator);
Vue.component('goal', Goal);
Vue.component('progressbar', progressbar);
Vue.component('tooltip', tooltip);

Vue.filter('moment', function(value, format) {
    return moment(new Date(value)).format(format);
});
Vue.filter('round', function(value, decimals) {
    if(!value) {
        value = 0;
    }

    if(!decimals) {
        decimals = 0;
    }

    value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return value;
});
Vue.filter('humandate', function(value) {
    return millisecondsToStr((value * 1000));
});

var vm = new Vue({
    el: '#app',
    data: {
        calculators: [1],
        nextId: 2
    },
    methods: {
        'addCalculator': function() {
            this.calculators.push(this.nextId);
            this.nextId++;
        },
        'removeCalculator': function (removeid) {
            this.calculators = this.calculators.filter(function (calcid) {
                return calcid != removeid;
            })
        }
    }
});

function millisecondsToStr (milliseconds) {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    var returnString = '';
    if (years) {
        returnString += ' ' + years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks? 
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        returnString += ' ' + days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        returnString += ' ' + hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        returnString += ' ' + minutes + ' min' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
        returnString += ' ' + seconds + ' sec' + numberEnding(seconds);
    }
    if (returnString == '')
        return 'less than a second'; //'just now' //or other string you like;

    return returnString;
}
